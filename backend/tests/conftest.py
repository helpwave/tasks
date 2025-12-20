import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from database.models.base import Base
from database.models.location import LocationNode
from database.models.patient import Patient
from database.models.task import Task
from database.models.user import User
from api.inputs import Sex, PatientState


@pytest.fixture
async def db_session():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> User:
    user = User(
        id="user-1",
        username="testuser",
        firstname="Test",
        lastname="User",
        title="Dr.",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_location(db_session: AsyncSession) -> LocationNode:
    location = LocationNode(
        id="location-1",
        title="Test Clinic",
        kind="CLINIC",
    )
    db_session.add(location)
    await db_session.commit()
    await db_session.refresh(location)
    return location


@pytest.fixture
async def sample_patient(db_session: AsyncSession, sample_location: LocationNode) -> Patient:
    from datetime import date

    patient = Patient(
        id="patient-1",
        firstname="John",
        lastname="Doe",
        birthdate=date(1990, 1, 1),
        sex=Sex.MALE.value,
        state=PatientState.ADMITTED.value,
        clinic_id=sample_location.id,
    )
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)
    return patient


@pytest.fixture
async def sample_task(db_session: AsyncSession, sample_patient: Patient) -> Task:
    task = Task(
        id="task-1",
        title="Test Task",
        description="Test Description",
        patient_id=sample_patient.id,
        done=False,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task

