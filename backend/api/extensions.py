from graphql import FieldNode, GraphQLError
from strawberry.extensions import SchemaExtension


class GlobalAuthExtension(SchemaExtension):
    def on_execute(self):
        execution_context = self.execution_context
        user = execution_context.context.user

        if user:
            yield
            return

        document = execution_context.graphql_document
        if document:
            for definition in document.definitions:
                if definition.kind == "operation_definition":
                    for selection in definition.selection_set.selections:
                        if not isinstance(selection, FieldNode):
                            continue

                        if selection.name.value.startswith("__"):
                            continue

                        raise GraphQLError(
                            message="Not authenticated",
                            extensions={"code": "UNAUTHENTICATED"},
                        )
        yield
