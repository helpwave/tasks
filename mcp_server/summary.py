from __future__ import annotations

from datetime import datetime
from typing import Any


def format_summary(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(tasks)
    done_tasks = [task for task in tasks if task.get("done") is True]
    open_tasks = [task for task in tasks if task.get("done") is False]
    due_dates = [
        task.get("dueDate")
        for task in tasks
        if task.get("dueDate")
    ]
    due_dates_sorted = sorted(
        due_dates,
        key=lambda value: datetime.fromisoformat(value.replace("Z", "+00:00")),
    )
    next_due_date = due_dates_sorted[0] if due_dates_sorted else None
    priorities = [task.get("priority") for task in open_tasks if task.get("priority")]
    return {
        "total_tasks": total,
        "open_tasks": len(open_tasks),
        "done_tasks": len(done_tasks),
        "next_due_date": next_due_date,
        "open_task_priorities": priorities,
    }
