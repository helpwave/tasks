import strawberry

from .location import LocationMutation, LocationQuery, LocationSubscription
from .patient import PatientMutation, PatientQuery, PatientSubscription
from .property import PropertyDefinitionMutation, PropertyDefinitionQuery
from .task import TaskMutation, TaskQuery, TaskSubscription
from .user import UserQuery


@strawberry.type
class Query(
    PatientQuery,
    TaskQuery,
    LocationQuery,
    PropertyDefinitionQuery,
    UserQuery,
):
    pass


@strawberry.type
class Mutation(
    PatientMutation,
    TaskMutation,
    PropertyDefinitionMutation,
    LocationMutation,
):
    pass


@strawberry.type
class Subscription(PatientSubscription, TaskSubscription, LocationSubscription):
    pass
