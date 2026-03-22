import strawberry

from .audit import AuditQuery
from .location import LocationMutation, LocationQuery, LocationSubscription
from .patient import PatientMutation, PatientQuery, PatientSubscription
from .property import PropertyDefinitionMutation, PropertyDefinitionQuery
from .query_metadata import QueryMetadataQuery
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
    QueryMetadataQuery,
):
    pass


@strawberry.type
class Mutation(
    PatientMutation,
    TaskMutation,
    PropertyDefinitionMutation,
    LocationMutation,
    UserMutation,
):
    pass


@strawberry.type
class Subscription(PatientSubscription, TaskSubscription, LocationSubscription):
    pass
