import strawberry

from .audit import AuditQuery
from .location import LocationMutation, LocationQuery, LocationSubscription
from .patient import PatientMutation, PatientQuery, PatientSubscription
from .property import PropertyDefinitionMutation, PropertyDefinitionQuery
from .query_metadata import QueryMetadataQuery
from .saved_view import SavedViewMutation, SavedViewQuery
from .task import TaskMutation, TaskQuery, TaskSubscription
from .task_preset import TaskPresetMutation, TaskPresetQuery
from .user import UserMutation, UserQuery


@strawberry.type
class Query(
    PatientQuery,
    TaskQuery,
    TaskPresetQuery,
    LocationQuery,
    PropertyDefinitionQuery,
    UserQuery,
    AuditQuery,
    QueryMetadataQuery,
    SavedViewQuery,
):
    pass


@strawberry.type
class Mutation(
    PatientMutation,
    TaskMutation,
    TaskPresetMutation,
    PropertyDefinitionMutation,
    LocationMutation,
    UserMutation,
    SavedViewMutation,
):
    pass


@strawberry.type
class Subscription(PatientSubscription, TaskSubscription, LocationSubscription):
    pass
