import pytest
from api.context import Context
from api.resolvers.patient import PatientQuery, PatientMutation
from api.inputs import Sex, PatientState
from database.models.property import PropertyDefinition, PropertyValue


class MockInfo:
    def __init__(self, db, user=None):
        self.context = Context(db=db, user=user)


@pytest.mark.asyncio
async def test_patient_query_get_patient(db_session, sample_patient, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    query = PatientQuery()
    result = await query.patient(info, sample_patient.id)
    assert result is not None
    assert result.id == sample_patient.id
    assert result.firstname == sample_patient.firstname


@pytest.mark.asyncio
async def test_patient_query_patients(db_session, sample_patient, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    query = PatientQuery()
    results = await query.patients(info)
    assert len(results) >= 1
    assert any(p.id == sample_patient.id for p in results)


@pytest.mark.asyncio
async def test_scoped_patient_counts(
    db_session, sample_location, sample_user_with_location_access
):
    from datetime import date

    from database.models.patient import Patient

    patients_by_state = [
        ("patient-wait", PatientState.WAIT),
        ("patient-admitted", PatientState.ADMITTED),
        ("patient-discharged", PatientState.DISCHARGED),
        ("patient-dead", PatientState.DEAD),
    ]
    for patient_id, state in patients_by_state:
        db_session.add(
            Patient(
                id=patient_id,
                firstname="Test",
                lastname=patient_id,
                birthdate=date(1990, 1, 1),
                sex=Sex.MALE.value,
                state=state.value,
                clinic_id=sample_location.id,
            )
        )
    await db_session.commit()

    info = MockInfo(db_session, sample_user_with_location_access)
    query = PatientQuery()
    counts = await query.scoped_patient_counts(
        info,
        root_location_ids=[sample_location.id],
    )

    assert counts.scoped_patients_total == 4
    assert counts.scoped_patients_waiting == 1
    assert counts.scoped_patients_admitted == 1
    assert counts.scoped_patients_discharged == 1
    assert counts.scoped_patients_deceased == 1


@pytest.mark.asyncio
async def test_patient_mutation_create_patient(db_session, sample_location, sample_user_with_location_access):
    from api.inputs import CreatePatientInput
    from datetime import date

    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = PatientMutation()
    input_data = CreatePatientInput(
        firstname="Jane",
        lastname="Doe",
        birthdate=date(1990, 1, 1),
        sex=Sex.FEMALE,
        clinic_id=sample_location.id,
    )
    result = await mutation.create_patient(info, input_data)
    assert result.id is not None
    assert result.firstname == "Jane"
    assert result.lastname == "Doe"
    assert result.clinic_id == sample_location.id


@pytest.mark.asyncio
async def test_patient_mutation_update_patient(db_session, sample_patient, sample_user_with_location_access):
    from api.inputs import UpdatePatientInput

    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = PatientMutation()
    input_data = UpdatePatientInput(firstname="Updated Name")
    result = await mutation.update_patient(info, sample_patient.id, input_data)
    assert result.firstname == "Updated Name"
    assert result.id == sample_patient.id


@pytest.mark.asyncio
async def test_patient_mutation_admit_patient(db_session, sample_patient, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = PatientMutation()
    result = await mutation.admit_patient(info, sample_patient.id)
    assert result.state == PatientState.ADMITTED.value


@pytest.mark.asyncio
async def test_patient_mutation_discharge_patient(db_session, sample_patient, sample_user_with_location_access):
    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = PatientMutation()
    result = await mutation.discharge_patient(info, sample_patient.id)
    assert result.state == PatientState.DISCHARGED.value


@pytest.mark.asyncio
async def test_patient_mutation_clear_patient_property(
    db_session, sample_patient, sample_user_with_location_access
):
    info = MockInfo(db_session, sample_user_with_location_access)
    mutation = PatientMutation()
    property_definition = PropertyDefinition(
        id="patient-property-definition-1",
        name="Test Patient Property",
        field_type="FIELD_TYPE_TEXT",
        allowed_entities="PATIENT",
        is_active=True,
    )
    other_property_definition = PropertyDefinition(
        id="other-patient-definition",
        name="Other Patient Property",
        field_type="FIELD_TYPE_TEXT",
        allowed_entities="PATIENT",
        is_active=True,
    )
    value_on_target = PropertyValue(
        id="patient-property-value-1",
        definition_id=property_definition.id,
        patient_id=sample_patient.id,
        text_value="A",
    )
    value_on_other_definition = PropertyValue(
        id="patient-property-value-2",
        definition_id=other_property_definition.id,
        patient_id=sample_patient.id,
        text_value="B",
    )
    db_session.add(property_definition)
    db_session.add(other_property_definition)
    db_session.add(value_on_target)
    db_session.add(value_on_other_definition)
    await db_session.commit()

    cleared_count = await mutation.clear_patient_property(
        info,
        property_definition_id=property_definition.id,
        patient_ids=[sample_patient.id],
    )

    assert cleared_count == 1
    remaining = await db_session.execute(
        PropertyValue.__table__.select().where(
            PropertyValue.id.in_(
                [
                    value_on_target.id,
                    value_on_other_definition.id,
                ]
            )
        )
    )
    remaining_ids = {row.id for row in remaining}
    assert value_on_target.id not in remaining_ids
    assert value_on_other_definition.id in remaining_ids
