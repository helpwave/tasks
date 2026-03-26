from typing import Any

from sqlalchemy import Select, select


def dedupe_orm_select_by_root_id(stmt: Select[Any], root_model: type) -> Select[Any]:
    opts = getattr(stmt, "_with_options", None) or ()
    stmt_flat = stmt.order_by(None).limit(None).offset(None)
    pk = root_model.id
    ids_sq = stmt_flat.with_only_columns(pk).distinct().scalar_subquery()
    out = select(root_model).where(root_model.id.in_(ids_sq))
    for opt in opts:
        out = out.options(opt)
    return out
