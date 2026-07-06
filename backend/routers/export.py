from urllib.parse import quote

from api.context import Context, get_context
from api.export.schemas import ExportEntity, TableExportRequest
from api.export.service import run_table_export
from fastapi import APIRouter, Depends, HTTPException, Response
from graphql import GraphQLError

router = APIRouter(prefix="/export", tags=["export"])

_GRAPHQL_ERROR_STATUS = {
    "FORBIDDEN": 403,
    "UNAUTHENTICATED": 401,
    "BAD_REQUEST": 400,
    "NOT_FOUND": 404,
}


@router.post("/{entity}")
async def export_table(
    entity: ExportEntity,
    request: TableExportRequest,
    context: Context = Depends(get_context),
) -> Response:
    if context.user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        result = await run_table_export(context, entity, request)
    except GraphQLError as error:
        code = (error.extensions or {}).get("code")
        raise HTTPException(
            status_code=_GRAPHQL_ERROR_STATUS.get(code, 400),
            detail=error.message,
        ) from error

    return Response(
        content=result.content,
        media_type=result.media_type,
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{quote(result.filename)}"
            ),
        },
    )
