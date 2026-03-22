import strawberry

from .audit import AuditQuery
from .location import LocationMutation, LocationQuery, LocationSubscription
from .patient import PatientMutation, PatientQuery, PatientSubscription
from .property import PropertyDefinitionMutation, PropertyDefinitionQuery
from .saved_view import SavedViewMutation, SavedViewQuery
from .task import TaskMutation, TaskQuery, TaskSubscription
from .user import UserMutation, UserQuery


@strawberry.type
class Query(
    PatientQuery,
    TaskQuery,
    LocationQuery,
    PropertyDefinitionQuery,
    UserQuery,
    AuditQuery,
    SavedViewQuery,
):
    pass


@strawberry.type
class Mutation(
    PatientMutation,
    TaskMutation,
    PropertyDefinitionMutation,
    LocationMutation,
    UserMutation,
    SavedViewMutation,
):
    pass


@strawberry.type
class Subscription(PatientSubscription, TaskSubscription, LocationSubscription):
    pass
