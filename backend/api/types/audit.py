from datetime import datetime

import strawberry


@strawberry.type
class AuditLogType:
    case_id: str
    activity: str
    user_id: str | None
    timestamp: datetime
    context: str | None
