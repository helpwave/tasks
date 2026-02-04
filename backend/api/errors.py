from graphql import GraphQLError

FORBIDDEN_MESSAGE = (
    "Insufficient permission. Please contact an administrator "
    "if you believe this is an error."
)


def raise_forbidden(message: str | None = None) -> None:
    raise GraphQLError(
        message or FORBIDDEN_MESSAGE,
        extensions={"code": "FORBIDDEN"},
    )
