from datetime import date

import pytest
from sqlalchemy import insert

from api.context import Context
from api.inputs import (
    CreateLocationNodeInput,
    CreatePropertyDefinitionInput,
    CreateSavedViewInput,
    FieldType,
    LocationType,
    PatientState,
    PropertyEntity,
    SavedViewEntityType,
    SavedViewVisibility,
    Sex,
    UpdatePropertyDefinitionInput,
)
from api.resolvers.audit import AuditQuery
from api.resolvers.location import LocationMutation
from api.resolvers.property import (
    PropertyDefinitionMutation,
    PropertyDefinitionQuery,
    validate_property_value_inputs,
)
from api.resolvers.saved_view import SavedViewQuery
from api.resolvers.task_preset import _can_edit_preset
from api.services.subscription import effective_root_location_ids
from database import models
from database.models.user import user_root_locations
from graphql import GraphQLError


class MockInfo:
    def __init__(self, db, user=None):
        self.context = Context(db=db, user=user)


@pytest.fixture(autouse=True)
def _no_redis(monkeypatch):
    async def _noop(*args, **kwargs):
        return None

    import api.services.notifications as notifications

    monkeypatch.setattr(notifications, "publish_to_redis", _noop, raising=False)


async def _add_root(db, user, location):
    await db.execute(
        insert(user_root_locations).values(
            user_id=user.id, location_id=location.id
        )
    )
    await db.commit()


async def _mk_user(db, uid):
    user = models.User(id=uid, username=uid, firstname="F", lastname="L")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _mk_location(db, lid, title, kind="CLINIC", parent_id=None):
    loc = models.LocationNode(id=lid, title=title, kind=kind, parent_id=parent_id)
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc


@pytest.fixture
async def two_tenants(db_session):
    user1 = await _mk_user(db_session, "user-1")
    user2 = await _mk_user(db_session, "user-2")
    loc_a = await _mk_location(db_session, "loc-a", "Tenant A")
    loc_b = await _mk_location(db_session, "loc-b", "Tenant B")
    child_a = await _mk_location(
        db_session, "loc-a-child", "Ward A1", kind="WARD", parent_id="loc-a"
    )
    await _add_root(db_session, user1, loc_a)
    await _add_root(db_session, user2, loc_b)
    return {
        "user1": user1,
        "user2": user2,
        "loc_a": loc_a,
        "loc_b": loc_b,
        "child_a": child_a,
    }


@pytest.mark.asyncio
async def test_property_definition_is_scoped_to_its_location(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info2 = MockInfo(db_session, two_tenants["user2"])

    created = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Blood type",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            location_id="loc-a",
        ),
    )
    assert created.location_id == "loc-a"

    visible_to_owner = await PropertyDefinitionQuery().property_definitions(info1)
    assert created.id in [d.id for d in visible_to_owner]

    visible_to_other = await PropertyDefinitionQuery().property_definitions(info2)
    assert created.id not in [d.id for d in visible_to_other]


@pytest.mark.asyncio
async def test_foreign_user_cannot_modify_definition(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info2 = MockInfo(db_session, two_tenants["user2"])
    created = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Scoped",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            location_id="loc-a",
        ),
    )
    with pytest.raises(GraphQLError):
        await PropertyDefinitionMutation().update_property_definition(
            info2,
            created.id,
            UpdatePropertyDefinitionInput(name="hijacked"),
        )


@pytest.mark.asyncio
async def test_create_definition_without_location_defaults_into_scope(
    two_tenants, db_session
):
    info1 = MockInfo(db_session, two_tenants["user1"])
    created = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Defaulted",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
        ),
    )
    assert created.location_id == "loc-a"


@pytest.mark.asyncio
async def test_global_definition_is_immutable(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    legacy = models.PropertyDefinition(
        id="legacy-def",
        name="Legacy",
        field_type="FIELD_TYPE_TEXT",
        allowed_entities="PATIENT",
        location_id=None,
    )
    db_session.add(legacy)
    await db_session.commit()
    with pytest.raises(GraphQLError):
        await PropertyDefinitionMutation().update_property_definition(
            info1, "legacy-def", UpdatePropertyDefinitionInput(name="x")
        )


@pytest.mark.asyncio
async def test_cannot_use_property_definition_out_of_scope(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info2 = MockInfo(db_session, two_tenants["user2"])
    created = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Only A",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            location_id="loc-a",
        ),
    )
    from api.inputs import PropertyValueInput

    props = [PropertyValueInput(definition_id=created.id, text_value="v")]
    # owner may use it, foreign user may not
    await validate_property_value_inputs(info1, props)
    with pytest.raises(GraphQLError):
        await validate_property_value_inputs(info2, props)


@pytest.mark.asyncio
async def test_link_shared_view_denied_across_scope(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info2 = MockInfo(db_session, two_tenants["user2"])
    from api.resolvers.saved_view import SavedViewMutation

    view = await SavedViewMutation().create_saved_view(
        info1,
        CreateSavedViewInput(
            name="Shared",
            base_entity_type=SavedViewEntityType.PATIENT,
            filter_definition="{}",
            sort_definition="{}",
            parameters="{}",
            visibility=SavedViewVisibility.LINK_SHARED,
            location_id="loc-a",
        ),
    )
    assert view.location_id == "loc-a"
    # owner reads it
    assert (await SavedViewQuery().saved_view(info1, view.id)) is not None
    # a user from another tenant cannot
    with pytest.raises(GraphQLError):
        await SavedViewQuery().saved_view(info2, view.id)


@pytest.mark.asyncio
async def test_audit_rejects_invalid_case_id(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    with pytest.raises(GraphQLError):
        await AuditQuery().audit_logs(info1, 'x" or true or "')


@pytest.mark.asyncio
async def test_audit_denies_foreign_case(two_tenants, db_session):
    patient = models.Patient(
        id="patient-a",
        firstname="A",
        lastname="B",
        birthdate=date(1990, 1, 1),
        sex=Sex.MALE.value,
        state=PatientState.ADMITTED.value,
        clinic_id="loc-a",
    )
    db_session.add(patient)
    await db_session.commit()
    info2 = MockInfo(db_session, two_tenants["user2"])
    with pytest.raises(GraphQLError):
        await AuditQuery().audit_logs(info2, "patient-a")


@pytest.mark.asyncio
async def test_user_directory_is_scoped(two_tenants, db_session):
    from api.resolvers.user import UserQuery

    info1 = MockInfo(db_session, two_tenants["user1"])
    # user-2 lives in another tenant and must not be reachable by id
    other = await UserQuery().user(info1, "user-2")
    assert other is None
    myself = await UserQuery().user(info1, "user-1")
    assert myself is not None


@pytest.mark.asyncio
async def test_location_children_are_scoped(two_tenants, db_session):
    from api.types.location import LocationNodeType

    info1 = MockInfo(db_session, two_tenants["user1"])
    info2 = MockInfo(db_session, two_tenants["user2"])
    node = LocationNodeType(
        id="loc-a", title="Tenant A", kind=LocationType.CLINIC, parent_id=None
    )
    owner_children = await node.children(info1)
    assert "loc-a-child" in [c.id for c in owner_children]
    foreign_children = await node.children(info2)
    assert foreign_children == []


@pytest.mark.asyncio
async def test_effective_subscription_roots_are_scoped(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    # no client ids -> caller's own roots
    assert set(await effective_root_location_ids(info1, None)) == {"loc-a"}
    # a foreign root requested by the client is dropped
    assert await effective_root_location_ids(info1, ["loc-b"]) == []
    # an in-scope child is kept
    assert await effective_root_location_ids(info1, ["loc-a"]) == ["loc-a"]


@pytest.mark.asyncio
async def test_create_root_location_is_denied(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    with pytest.raises(GraphQLError):
        await LocationMutation().create_location_node(
            info1,
            CreateLocationNodeInput(title="Rogue Root", kind=LocationType.CLINIC),
        )


def test_global_preset_not_editable_by_non_owner():
    class _Preset:
        scope = "GLOBAL"
        owner_user_id = "creator"

    assert _can_edit_preset(_Preset(), "someone-else") is False
    assert _can_edit_preset(_Preset(), "creator") is True
