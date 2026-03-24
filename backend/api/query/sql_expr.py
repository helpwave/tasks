from typing import Any

from sqlalchemy import String, and_, case, cast, func


def user_display_label_expr(user_table: Any) -> Any:
    return cast(
        func.coalesce(
            case(
                (
                    and_(
                        user_table.firstname.isnot(None),
                        user_table.lastname.isnot(None),
                    ),
                    user_table.firstname + " " + user_table.lastname,
                ),
                else_=None,
            ),
            user_table.username,
        ),
        String,
    )


def patient_display_name_expr(patient_table: Any) -> Any:
    return cast(
        func.trim(patient_table.firstname + " " + patient_table.lastname),
        String,
    )


def location_title_expr(location_table: Any) -> Any:
    return cast(location_table.title, String)
