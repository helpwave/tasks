import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import strawberry
from auth import get_token_from_connection_params, get_user_payload, verify_token
from database.models.location import LocationNode, location_organizations
from database.models.user import User, user_root_locations
from database.session import get_db_session
from fastapi import Depends
from graphql import GraphQLError
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import HTTPConnection
from strawberry.fastapi import BaseContext

logger = logging.getLogger(__name__)


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
    def __init__(self, db: AsyncSession, user: "User | None" = None, organizations: str | None = None):
        super().__init__()
        self._db = db
        self.user = user
        self.organizations = organizations
        self._accessible_location_ids: set[str] | None = None
        self._accessible_location_ids_lock = asyncio.Lock()
        self._db_lock = asyncio.Lock()
        self.db = LockedAsyncSession(db, self._db_lock)


Info = strawberry.Info[Context, Any]


def _organizations_from_payload(user_payload: dict) -> str | None:
    organizations_raw = user_payload.get("organization")
    if not organizations_raw:
        return None
    if isinstance(organizations_raw, list):
        org_list = [str(org) for org in organizations_raw if org]
        return ",".join(org_list) if org_list else None
    return str(organizations_raw)


async def _resolve_user_from_payload(
    session: AsyncSession | LockedAsyncSession,
    user_payload: dict,
) -> "User | None":
    user_id = user_payload.get("sub")
    if not user_id:
        return None
    username = user_payload.get("preferred_username") or user_payload.get("name")
    firstname = user_payload.get("given_name")
    lastname = user_payload.get("family_name")
    email = user_payload.get("email")
    picture = user_payload.get("picture")
    organizations = _organizations_from_payload(user_payload)

    result = await session.execute(select(User).where(User.id == user_id))
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
                last_online=datetime.now(timezone.utc),
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
        except Exception as e:
            await session.rollback()
            raise GraphQLError(
                "Failed to create user. Please contact an administrator if you believe this is an error.",
                extensions={"code": "INTERNAL_SERVER_ERROR"},
            ) from e

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
        db_user.last_online = datetime.now(timezone.utc)
        session.add(db_user)
        try:
            await _update_user_root_locations(
                session,
                db_user,
                organizations,
            )
        except Exception as e:
            raise GraphQLError(
                "Failed to update user root locations. Please contact an administrator if you believe this is an error.",
                extensions={"code": "INTERNAL_SERVER_ERROR"},
            ) from e

    return db_user


async def get_user_from_connection_params(
    connection_params: dict | None,
    session: AsyncSession | LockedAsyncSession,
) -> "User | None":
    token = get_token_from_connection_params(connection_params)
    if not token:
        return None
    try:
        user_payload = verify_token(token)
    except Exception as e:
        logger.warning("WebSocket auth failed for token: %s", e)
        return None
    return await _resolve_user_from_payload(session, user_payload)


async def get_context(
    connection: HTTPConnection,
    session=Depends(get_db_session),
) -> Context:
    user_payload = get_user_payload(connection)
    db_user = None
    organizations = None

    if user_payload:
        organizations = _organizations_from_payload(user_payload)
        db_user = await _resolve_user_from_payload(session, user_payload)

    return Context(db=session, user=db_user, organizations=organizations)


async def _update_user_root_locations(
    session: AsyncSession | LockedAsyncSession,
    user: User,
    organizations: str | None,
) -> None:
    organization_ids: list[str] = []
    if organizations:
        organization_ids = [
            org_id.strip()
            for org_id in organizations.split(",")
            if org_id.strip()
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
                location_organizations.c.organization_id.in_(organization_ids),
            ),
        )
        found_locations = result.scalars().all()
        root_location_ids = [loc.id for loc in found_locations]

        found_org_ids = set()
        for loc in found_locations:
            org_result = await session.execute(
                select(location_organizations.c.organization_id).where(
                    location_organizations.c.location_id == loc.id,
                    location_organizations.c.organization_id.in_(
                        organization_ids,
                    ),
                ),
            )
            found_org_ids.update(row[0] for row in org_result.all())

        for org_id in organization_ids:
            if org_id not in found_org_ids:
                new_location = LocationNode(
                    title=f"Organization {org_id[:8]}",
                    kind="CLINIC",
                    parent_id=None,
                )
                session.add(new_location)
                await session.flush()
                await session.refresh(new_location)

                await session.execute(
                    location_organizations.insert().values(
                        location_id=new_location.id,
                        organization_id=org_id,
                    ),
                )
                root_location_ids.append(new_location.id)

    if not root_location_ids:
        personal_org_title = f"{user.username}'s Organization"
        result = await session.execute(
            select(LocationNode).where(
                LocationNode.title == personal_org_title,
                LocationNode.parent_id.is_(None),
            ),
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
        delete(user_root_locations).where(
            user_root_locations.c.user_id == user.id,
        ),
    )

    if root_location_ids:
        stmt = insert(user_root_locations).values(
            [
                {"user_id": user.id, "location_id": loc_id}
                for loc_id in root_location_ids
            ],
        )
        stmt = stmt.on_conflict_do_nothing(
            index_elements=["user_id", "location_id"],
        )
        await session.execute(stmt)

    await session.commit()
