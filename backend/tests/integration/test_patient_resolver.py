import pytest
from api.context import Context
from api.resolvers.patient import PatientQuery, PatientMutation
from api.inputs import Sex, PatientState


class MockInfo:
    def __init__(self, db):
        self.context = Context(db=db)


@pytest.mark.asyncio
async def test_patient_query_get_patient(db_session, sample_patient):
    info = MockInfo(db_session)
    query = PatientQuery()
    result = await query.patient(info, sample_patient.id)
    assert result is not None
    assert result.id == sample_patient.id
    assert result.firstname == sample_patient.firstname


@pytest.mark.asyncio
async def test_patient_query_patients(db_session, sample_patient):
    info = MockInfo(db_session)
    query = PatientQuery()
    results = await query.patients(info)
    assert len(results) >= 1
    assert any(p.id == sample_patient.id for p in results)


@pytest.mark.asyncio
async def test_patient_mutation_create_patient(db_session, sample_location):
    from api.inputs import CreatePatientInput

    info = MockInfo(db_session)
    mutation = PatientMutation()
    input_data = CreatePatientInput(
        firstname="Jane",
        lastname="Doe",
        sex=Sex.FEMALE,
        clinic_id=sample_location.id,
    )
    result = await mutation.create_patient(info, input_data)
    assert result.id is not None
    assert result.firstname == "Jane"
    assert result.lastname == "Doe"
    assert result.clinic_id == sample_location.id


@pytest.mark.asyncio
async def test_patient_mutation_update_patient(db_session, sample_patient):
    from api.inputs import UpdatePatientInput

    info = MockInfo(db_session)
    mutation = PatientMutation()
    input_data = UpdatePatientInput(firstname="Updated Name")
    result = await mutation.update_patient(info, sample_patient.id, input_data)
    assert result.firstname == "Updated Name"
    assert result.id == sample_patient.id


@pytest.mark.asyncio
async def test_patient_mutation_admit_patient(db_session, sample_patient):
    info = MockInfo(db_session)
    mutation = PatientMutation()
    result = await mutation.admit_patient(info, sample_patient.id)
    assert result.state == PatientState.ADMITTED.value


@pytest.mark.asyncio
async def test_patient_mutation_discharge_patient(db_session, sample_patient):
    info = MockInfo(db_session)
    mutation = PatientMutation()
    result = await mutation.discharge_patient(info, sample_patient.id)
    assert result.state == PatientState.DISCHARGED.value
