from fastapi import HTTPException
from graphql import FieldNode
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
                            raise HTTPException(
                                status_code=401, detail="Not authenticated"
                            )
                        if not selection.name.value.startswith("__"):
                            raise HTTPException(
                                status_code=401, detail="Not authenticated"
                            )
        yield
