import asyncio
import logging
from typing import Any

import strawberry
from auth import get_user_payload
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


async def get_context(
    connection: HTTPConnection,
    session=Depends(get_db_session),
) -> Context:
    user_payload = get_user_payload(connection)
    db_user = None
    organizations = None

    if user_payload:
        user_id = user_payload.get("sub")
        username = user_payload.get("preferred_username") or user_payload.get(
            "name",
        )
        firstname = user_payload.get("given_name")
        lastname = user_payload.get("family_name")
        email = user_payload.get("email")
        picture = user_payload.get("picture")

        # Debug: Log available keys in token to help diagnose missing organization claim
        logger = logging.getLogger(__name__)
        organizations_raw = user_payload.get("organization")
        
        if organizations_raw is None:
            # Check if organization scope is in the token
            scope = user_payload.get("scope", "")
            has_org_scope = "organization" in scope.split() if scope else False
            # Use warning level so it's visible in logs
            logger.warning(
                f"Organization claim not found in token for user {user_payload.get('sub', 'unknown')}. "
                f"Has organization scope: {has_org_scope}. "
                f"Token scope: {scope}. "
                f"Available claims: {sorted(user_payload.keys())}"
            )
            # Also print to console for immediate visibility
            print(f"WARNING: Organization claim missing. Scope: {scope}, Available claims: {sorted(user_payload.keys())}")
        
        organizations = None
        if organizations_raw:
            if isinstance(organizations_raw, list):
                # Filter out empty strings and None values
                org_list = [str(org) for org in organizations_raw if org]
                if org_list:
                    organizations = ",".join(org_list)
            else:
                organizations = str(organizations_raw) if organizations_raw else None

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
                try:
                    # Debug output
                    if organizations is None:
                        print(f"WARNING: organizations is None for user {db_user.id} ({db_user.username})")
                        print(f"Token payload keys: {sorted(user_payload.keys())}")
                        print(f"Token scope: {user_payload.get('scope', 'N/A')}")
                    else:
                        print(f"Organizations for user {db_user.id}: {organizations}")
                    
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

    return Context(db=session, user=db_user, organizations=organizations)


async def _update_user_root_locations(
    session: AsyncSession,
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

    logger = logging.getLogger(__name__)
    logger.info(f"Updating root locations for user {user.id} with organizations: {organization_ids}")

    root_location_ids: list[str] = []

    if organization_ids:
        logger.info(f"Looking up locations for organization IDs: {organization_ids}")
        # First check if any location_organizations entries exist
        org_check = await session.execute(
            select(location_organizations.c.organization_id, location_organizations.c.location_id)
            .where(location_organizations.c.organization_id.in_(organization_ids))
        )
        org_entries = org_check.all()
        logger.info(f"Found {len(org_entries)} location_organizations entries: {[(row[0], row[1]) for row in org_entries]}")
        
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
        logger.info(f"Found {len(found_locations)} existing locations for organizations: {[loc.id for loc in found_locations]}")

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
                logger.info(f"Created new location {new_location.id} for organization {org_id}")
    
    logger.info(f"Total root location IDs: {root_location_ids}")
    
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
        logger.info(f"Using personal location: {personal_location.id}")

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
        logger.info(f"Inserted {len(root_location_ids)} root locations for user {user.id}: {root_location_ids}")

    await session.commit()
    logger.info(f"Root locations update completed for user {user.id}")
