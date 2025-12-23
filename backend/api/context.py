import asyncio
from typing import Any

import strawberry
from auth import get_user_payload
from database.models.location import LocationNode
from database.models.user import User, user_root_locations
from database.session import get_db_session
from fastapi import Depends
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import HTTPConnection
from strawberry.fastapi import BaseContext


class LockedAsyncSession:
    def __init__(self, session: AsyncSession, lock: asyncio.Lock):
        self._session = session
        self._lock = lock

    async def execute(self, *args, **kwargs):
        async with self._lock:
            return await self._session.execute(*args, **kwargs)

    async def commit(self, *args, **kwargs):
        async with self._lock:
            return await self._session.commit(*args, **kwargs)

    async def rollback(self, *args, **kwargs):
        async with self._lock:
            return await self._session.rollback(*args, **kwargs)

    async def flush(self, *args, **kwargs):
        async with self._lock:
            return await self._session.flush(*args, **kwargs)

    async def refresh(self, *args, **kwargs):
        async with self._lock:
            return await self._session.refresh(*args, **kwargs)

    def add(self, *args, **kwargs):
        return self._session.add(*args, **kwargs)

    def __getattr__(self, name):
        return getattr(self._session, name)


class Context(BaseContext):
    def __init__(self, db: AsyncSession, user: "User | None" = None):
        super().__init__()
        self._db = db
        self.user = user
        self._accessible_location_ids: set[str] | None = None
        self._accessible_location_ids_lock = asyncio.Lock()
        self._db_lock = asyncio.Lock()
        self.db = LockedAsyncSession(db, self._db_lock)


Info = strawberry.Info[Context, Any]


async def get_context(
    connection: HTTPConnection,
    session=Depends(get_db_session),
) -> Context:
    user_payload = get_user_payload(connection)
    db_user = None

    if user_payload:
        user_id = user_payload.get("sub")
        username = user_payload.get("preferred_username") or user_payload.get(
            "name",
        )
        firstname = user_payload.get("given_name")
        lastname = user_payload.get("family_name")
        email = user_payload.get("email")
        picture = user_payload.get("picture")

        organizations_raw = user_payload.get("organization")
        organizations = None
        if organizations_raw:
            if isinstance(organizations_raw, list):
                organizations = ",".join(str(org) for org in organizations_raw)
            else:
                organizations = str(organizations_raw)

        if user_id:
            result = await session.execute(
                select(User).where(User.id == user_id),
            )
            db_user = result.scalars().first()

            if not db_user:
                try:
                    new_user = User(
                        id=user_id,
                        username=username,
                        email=email,
                        firstname=firstname,
                        lastname=lastname,
                        title="User",
                        avatar_url=picture,
                    )
                    session.add(new_user)
                    await session.commit()
                    await session.refresh(new_user)
                    db_user = new_user
                except IntegrityError:
                    await session.rollback()
                    result = await session.execute(
                        select(User).where(User.id == user_id),
                    )
                    db_user = result.scalars().first()

            if db_user and (
                db_user.username != username
                or db_user.firstname != firstname
                or db_user.lastname != lastname
                or db_user.email != email
                or db_user.avatar_url != picture
            ):
                db_user.username = username
                db_user.firstname = firstname
                db_user.lastname = lastname
                db_user.email = email
                if picture:
                    db_user.avatar_url = picture
                session.add(db_user)
                await session.commit()
                await session.refresh(db_user)

            if db_user:
                await _update_user_root_locations(session, db_user, organizations)

    return Context(db=session, user=db_user)


async def _update_user_root_locations(
    session: AsyncSession, user: User, organizations: str | None
) -> None:
    from database.models.location import location_organizations

    organization_ids: list[str] = []
    if organizations:
        organization_ids = [
            org_id.strip() for org_id in organizations.split(",") if org_id.strip()
        ]

    root_location_ids: list[str] = []

    if organization_ids:
        result = await session.execute(
            select(LocationNode)
            .join(
                location_organizations,
                LocationNode.id == location_organizations.c.location_id,
            )
            .where(
                LocationNode.kind == "CLINIC",
                location_organizations.c.organization_id.in_(organization_ids),
            )
            .distinct()
        )
        found_locations = result.scalars().all()
        root_location_ids = [loc.id for loc in found_locations]

    if not root_location_ids:
        personal_org_title = f"{user.username}'s Organization"
        result = await session.execute(
            select(LocationNode).where(
                LocationNode.title == personal_org_title,
                LocationNode.parent_id.is_(None),
            )
        )
        personal_location = result.scalars().first()

        if not personal_location:
            personal_location = LocationNode(
                title=personal_org_title,
                kind="CLINIC",
                parent_id=None,
            )
            session.add(personal_location)
            await session.flush()

        root_location_ids = [personal_location.id]

    await session.execute(
        delete(user_root_locations).where(user_root_locations.c.user_id == user.id)
    )

    if root_location_ids:
        from sqlalchemy.dialects.postgresql import insert
        stmt = insert(user_root_locations).values(
            [
                {"user_id": user.id, "location_id": loc_id}
                for loc_id in root_location_ids
            ]
        )
        stmt = stmt.on_conflict_do_nothing(index_elements=["user_id", "location_id"])
        await session.execute(stmt)

    await session.commit()
