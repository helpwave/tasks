import strawberry


@strawberry.type
class UserType:
    id: strawberry.ID
    name: str
    firstname: str | None
    lastname: str | None
    title: str | None
    avatar_url: str | None
