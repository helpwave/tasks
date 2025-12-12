import strawberry

from .location import LocationMutation, LocationQuery
from .patient import PatientMutation, PatientQuery, PatientSubscription
from .property import PropertyDefinitionMutation, PropertyDefinitionQuery
from .task import TaskMutation, TaskQuery


@strawberry.type
class Query(
    PatientQuery,
    TaskQuery,
    LocationQuery,
    PropertyDefinitionQuery,
):
    pass


@strawberry.type
class Mutation(
    PatientMutation,
    TaskMutation,
    LocationMutation,
    PropertyDefinitionMutation,
):
    pass


@strawberry.type
class Subscription(PatientSubscription):
    pass
