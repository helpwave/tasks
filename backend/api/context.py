from typing import TYPE_CHECKING, Any

import strawberry
from auth import get_user_payload
from database.models.user import User
from database.session import get_db_session
from fastapi import Depends
from sqlalchemy import select
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

        if user_id:
            result = await session.execute(
                select(User).where(User.id == user_id),
            )
            db_user = result.scalars().first()

            if not db_user:
                db_user = User(
                    id=user_id,
                    username=username,
                    firstname=firstname,
                    lastname=lastname,
                    title="User",
                )
                session.add(db_user)
            elif (
                db_user.username != username
                or db_user.firstname != firstname
                or db_user.lastname != lastname
            ):
                db_user.username = username
                db_user.firstname = firstname
                db_user.lastname = lastname

            await session.commit()
            await session.refresh(db_user)

    return Context(db=session, user=db_user)
