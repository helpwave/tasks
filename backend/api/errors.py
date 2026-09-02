from graphql import GraphQLError

FORBIDDEN_MESSAGE = (
    "Insufficient permission. Please contact an administrator "
    "if you believe this is an error."
)

UNAUTHENTICATED_MESSAGE = "Not authenticated"


def raise_forbidden(message: str | None = None) -> None:
    raise GraphQLError(
        message or FORBIDDEN_MESSAGE,
        extensions={"code": "FORBIDDEN"},
    )


def raise_unauthenticated(message: str | None = None) -> None:
    raise GraphQLError(
        message or UNAUTHENTICATED_MESSAGE,
        extensions={"code": "UNAUTHENTICATED"},
    )
