from typing import TYPE_CHECKING, Any

import strawberry
from auth import get_user_payload
from database.models.user import User
from database.session import get_db_session
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import HTTPConnection
from strawberry.fastapi import BaseContext

if TYPE_CHECKING:
    from database.models.user import User


class Context(BaseContext):
    def __init__(self, db: AsyncSession, user: "User | None" = None):
        super().__init__()
        self.db = db
        self.user = user


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
        
        # Extract organizations from OIDC token (can be array or single value)
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
                        organizations=organizations,
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
                or db_user.organizations != organizations
            ):
                db_user.username = username
                db_user.firstname = firstname
                db_user.lastname = lastname
                db_user.email = email
                if picture:
                    db_user.avatar_url = picture
                db_user.organizations = organizations
                session.add(db_user)
                await session.commit()
                await session.refresh(db_user)

    return Context(db=session, user=db_user)
