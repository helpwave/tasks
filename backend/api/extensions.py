from graphql import (
    FieldNode,
    FragmentSpreadNode,
    GraphQLError,
    InlineFragmentNode,
    OperationDefinitionNode,
)
from strawberry.extensions import SchemaExtension


def _iter_top_level_fields(document, selection_set, fragments, seen_fragments):
    if selection_set is None:
        return
    for selection in selection_set.selections:
        if isinstance(selection, FieldNode):
            yield selection
        elif isinstance(selection, InlineFragmentNode):
            yield from _iter_top_level_fields(
                document, selection.selection_set, fragments, seen_fragments
            )
        elif isinstance(selection, FragmentSpreadNode):
            name = selection.name.value
            if name in seen_fragments:
                continue
            seen_fragments.add(name)
            fragment = fragments.get(name)
            if fragment is not None:
                yield from _iter_top_level_fields(
                    document, fragment.selection_set, fragments, seen_fragments
                )


class GlobalAuthExtension(SchemaExtension):
    def on_execute(self):
        execution_context = self.execution_context
        user = getattr(execution_context.context, "user", None)

        if user is not None:
            yield
            return

        document = execution_context.graphql_document
        if document is not None:
            fragments = {
                definition.name.value: definition
                for definition in document.definitions
                if not isinstance(definition, OperationDefinitionNode)
                and hasattr(definition, "name")
                and definition.name is not None
            }
            for definition in document.definitions:
                if not isinstance(definition, OperationDefinitionNode):
                    continue
                for field in _iter_top_level_fields(
                    document, definition.selection_set, fragments, set()
                ):
                    if field.name.value.startswith("__"):
                        continue
                    raise GraphQLError(
                        message="Not authenticated",
                        extensions={"code": "UNAUTHENTICATED"},
                    )
        yield
