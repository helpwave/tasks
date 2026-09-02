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
    ScopeVisibility,
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
from api.resolvers.saved_view import SavedViewMutation, SavedViewQuery
from api.resolvers.task_preset import (
    TaskPresetMutation,
    TaskPresetQuery,
    _can_edit_preset,
)
from api.inputs import (
    CreateTaskPresetInput,
    TaskGraphInput,
    TaskGraphNodeInput,
    UpdateSavedViewInput,
    UpdateTaskPresetInput,
)
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
    user3 = await _mk_user(db_session, "user-3")
    user4 = await _mk_user(db_session, "user-4")
    loc_a = await _mk_location(db_session, "loc-a", "Tenant A")
    loc_b = await _mk_location(db_session, "loc-b", "Tenant B")
    child_a = await _mk_location(
        db_session, "loc-a-child", "Ward A1", kind="WARD", parent_id="loc-a"
    )
    child_a2 = await _mk_location(
        db_session, "loc-a-child-2", "Ward A2", kind="WARD", parent_id="loc-a"
    )
    await _add_root(db_session, user1, loc_a)
    await _add_root(db_session, user2, loc_b)
    await _add_root(db_session, user3, child_a)
    await _add_root(db_session, user4, loc_a)
    return {
        "user1": user1,
        "user2": user2,
        "user3": user3,
        "user4": user4,
        "loc_a": loc_a,
        "loc_b": loc_b,
        "child_a": child_a,
        "child_a2": child_a2,
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
            visibility=ScopeVisibility.PUBLIC,
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
            visibility=ScopeVisibility.PUBLIC,
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
async def test_create_public_definition_without_location_defaults_into_scope(
    two_tenants, db_session
):
    info1 = MockInfo(db_session, two_tenants["user1"])
    created = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Defaulted",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            visibility=ScopeVisibility.PUBLIC,
        ),
    )
    assert created.location_id == "loc-a"
    assert created.visibility == "public"


@pytest.mark.asyncio
async def test_private_definition_is_only_visible_to_owner(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info3 = MockInfo(db_session, two_tenants["user3"])
    created = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Mine",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            location_id="loc-a",
        ),
    )
    assert created.visibility == "private"
    assert created.location_id is None
    assert created.owner_user_id == "user-1"

    assert created.id in [
        d.id for d in await PropertyDefinitionQuery().property_definitions(info1)
    ]
    assert created.id not in [
        d.id for d in await PropertyDefinitionQuery().property_definitions(info3)
    ]
    with pytest.raises(GraphQLError):
        await PropertyDefinitionMutation().update_property_definition(
            info3, created.id, UpdatePropertyDefinitionInput(name="x")
        )


@pytest.mark.asyncio
async def test_public_definition_is_visible_along_the_location_path(
    two_tenants, db_session
):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info3 = MockInfo(db_session, two_tenants["user3"])
    info4 = MockInfo(db_session, two_tenants["user4"])
    on_parent = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Parent",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            visibility=ScopeVisibility.PUBLIC,
            location_id="loc-a",
        ),
    )
    on_child = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Child",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            visibility=ScopeVisibility.PUBLIC,
            location_id="loc-a-child",
        ),
    )
    on_sibling = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Sibling",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            visibility=ScopeVisibility.PUBLIC,
            location_id="loc-a-child-2",
        ),
    )

    parent_root_ids = {
        d.id for d in await PropertyDefinitionQuery().property_definitions(info1)
    }
    assert {on_parent.id, on_child.id, on_sibling.id} <= parent_root_ids

    child_root_ids = {
        d.id for d in await PropertyDefinitionQuery().property_definitions(info3)
    }
    assert on_parent.id in child_root_ids
    assert on_child.id in child_root_ids
    assert on_sibling.id not in child_root_ids

    unselected_ids = {
        d.id for d in await PropertyDefinitionQuery().property_definitions(info4)
    }
    assert {on_parent.id, on_child.id, on_sibling.id} <= unselected_ids
    selected_ids = {
        d.id
        for d in await PropertyDefinitionQuery().property_definitions(
            info4, root_location_ids=["loc-a-child"]
        )
    }
    assert on_parent.id in selected_ids
    assert on_child.id in selected_ids
    assert on_sibling.id not in selected_ids
    owner_selected_ids = {
        d.id
        for d in await PropertyDefinitionQuery().property_definitions(
            info1, root_location_ids=["loc-a-child"]
        )
    }
    assert on_sibling.id in owner_selected_ids

    with pytest.raises(GraphQLError):
        await PropertyDefinitionMutation().update_property_definition(
            info3, on_parent.id, UpdatePropertyDefinitionInput(name="x")
        )
    updated = await PropertyDefinitionMutation().update_property_definition(
        info3, on_child.id, UpdatePropertyDefinitionInput(name="renamed")
    )
    assert updated.name == "renamed"


@pytest.mark.asyncio
async def test_public_definition_can_be_made_private(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    created = await PropertyDefinitionMutation().create_property_definition(
        info1,
        CreatePropertyDefinitionInput(
            name="Toggle",
            field_type=FieldType.FIELD_TYPE_TEXT,
            allowed_entities=[PropertyEntity.PATIENT],
            visibility=ScopeVisibility.PUBLIC,
            location_id="loc-a",
        ),
    )
    updated = await PropertyDefinitionMutation().update_property_definition(
        info1,
        created.id,
        UpdatePropertyDefinitionInput(visibility=ScopeVisibility.PRIVATE),
    )
    assert updated.visibility == "private"
    assert updated.location_id is None
    with pytest.raises(GraphQLError):
        await PropertyDefinitionMutation().update_property_definition(
            info1,
            created.id,
            UpdatePropertyDefinitionInput(
                visibility=ScopeVisibility.PUBLIC, location_id="loc-b"
            ),
        )


@pytest.mark.asyncio
async def test_global_definition_is_immutable(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    legacy = models.PropertyDefinition(
        id="legacy-def",
        name="Legacy",
        field_type="FIELD_TYPE_TEXT",
        allowed_entities="PATIENT",
        visibility="public",
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
            visibility=ScopeVisibility.PUBLIC,
            location_id="loc-a",
        ),
    )
    from api.inputs import PropertyValueInput

    props = [PropertyValueInput(definition_id=created.id, text_value="v")]
    await validate_property_value_inputs(info1, props)
    with pytest.raises(GraphQLError):
        await validate_property_value_inputs(info2, props)


@pytest.mark.asyncio
async def test_public_view_denied_across_scope(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info2 = MockInfo(db_session, two_tenants["user2"])
    info3 = MockInfo(db_session, two_tenants["user3"])

    view = await SavedViewMutation().create_saved_view(
        info1,
        CreateSavedViewInput(
            name="Shared",
            base_entity_type=SavedViewEntityType.PATIENT,
            filter_definition="{}",
            sort_definition="{}",
            parameters="{}",
            visibility=ScopeVisibility.PUBLIC,
            location_id="loc-a",
        ),
    )
    assert view.location_id == "loc-a"
    assert (await SavedViewQuery().saved_view(info1, view.id)) is not None
    assert (await SavedViewQuery().saved_view(info3, view.id)) is not None
    assert view.id in [v.id for v in await SavedViewQuery().my_saved_views(info3)]
    with pytest.raises(GraphQLError):
        await SavedViewQuery().saved_view(info2, view.id)


@pytest.mark.asyncio
async def test_private_view_is_owner_only_and_needs_no_location(
    two_tenants, db_session
):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info3 = MockInfo(db_session, two_tenants["user3"])

    view = await SavedViewMutation().create_saved_view(
        info1,
        CreateSavedViewInput(
            name="Private",
            base_entity_type=SavedViewEntityType.TASK,
            filter_definition="{}",
            sort_definition="{}",
            parameters="{}",
            location_id="loc-a",
        ),
    )
    assert view.visibility == ScopeVisibility.PRIVATE
    assert view.location_id is None
    assert view.id in [v.id for v in await SavedViewQuery().my_saved_views(info1)]
    assert view.id not in [v.id for v in await SavedViewQuery().my_saved_views(info3)]
    with pytest.raises(GraphQLError):
        await SavedViewQuery().saved_view(info3, view.id)

    published = await SavedViewMutation().update_saved_view(
        info1,
        view.id,
        UpdateSavedViewInput(visibility=ScopeVisibility.PUBLIC, location_id="loc-a-child"),
    )
    assert published.visibility == ScopeVisibility.PUBLIC
    assert published.location_id == "loc-a-child"
    assert (await SavedViewQuery().saved_view(info3, view.id)) is not None
    with pytest.raises(GraphQLError):
        await SavedViewMutation().update_saved_view(
            info3, view.id, UpdateSavedViewInput(name="hijacked")
        )


def _preset_input(name: str, **kwargs) -> CreateTaskPresetInput:
    return CreateTaskPresetInput(
        name=name,
        graph=TaskGraphInput(
            nodes=[TaskGraphNodeInput(node_id="n1", title="Step")],
            edges=[],
        ),
        **kwargs,
    )


@pytest.mark.asyncio
async def test_task_presets_are_scoped_by_visibility(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    info2 = MockInfo(db_session, two_tenants["user2"])
    info3 = MockInfo(db_session, two_tenants["user3"])

    private = await TaskPresetMutation().create_task_preset(
        info1, _preset_input("Private")
    )
    assert private.visibility == ScopeVisibility.PRIVATE
    assert private.location_id is None
    assert private.is_owner is True

    public = await TaskPresetMutation().create_task_preset(
        info1,
        _preset_input(
            "Public", visibility=ScopeVisibility.PUBLIC, location_id="loc-a"
        ),
    )
    assert public.location_id == "loc-a"

    ids_for_owner = {p.id for p in await TaskPresetQuery().task_presets(info1)}
    assert {private.id, public.id} <= ids_for_owner

    ids_for_child_root = {p.id for p in await TaskPresetQuery().task_presets(info3)}
    assert public.id in ids_for_child_root
    assert private.id not in ids_for_child_root
    visible = await TaskPresetQuery().task_preset(info3, public.id)
    assert visible is not None and visible.is_owner is False

    assert (await TaskPresetQuery().task_presets(info2)) == []
    with pytest.raises(GraphQLError):
        await TaskPresetQuery().task_preset(info2, public.id)
    with pytest.raises(GraphQLError):
        await TaskPresetQuery().task_preset(info3, private.id)
    with pytest.raises(GraphQLError):
        await TaskPresetMutation().update_task_preset(
            info3, public.id, UpdateTaskPresetInput(name="hijacked")
        )
    with pytest.raises(GraphQLError):
        await TaskPresetMutation().create_task_preset(
            info1,
            _preset_input(
                "Foreign", visibility=ScopeVisibility.PUBLIC, location_id="loc-b"
            ),
        )

    unpublished = await TaskPresetMutation().update_task_preset(
        info1, public.id, UpdateTaskPresetInput(visibility=ScopeVisibility.PRIVATE)
    )
    assert unpublished.visibility == ScopeVisibility.PRIVATE
    assert unpublished.location_id is None
    with pytest.raises(GraphQLError):
        await TaskPresetQuery().task_preset(info3, public.id)


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
    assert set(await effective_root_location_ids(info1, None)) == {"loc-a"}
    assert await effective_root_location_ids(info1, ["loc-b"]) == []
    assert await effective_root_location_ids(info1, ["loc-a"]) == ["loc-a"]


@pytest.mark.asyncio
async def test_create_root_location_is_denied(two_tenants, db_session):
    info1 = MockInfo(db_session, two_tenants["user1"])
    with pytest.raises(GraphQLError):
        await LocationMutation().create_location_node(
            info1,
            CreateLocationNodeInput(title="Rogue Root", kind=LocationType.CLINIC),
        )


def test_public_preset_not_editable_by_non_owner():
    class _Preset:
        visibility = "public"
        owner_user_id = "creator"

    assert _can_edit_preset(_Preset(), "someone-else") is False
    assert _can_edit_preset(_Preset(), "creator") is True
