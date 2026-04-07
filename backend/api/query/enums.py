from enum import Enum

import strawberry


@strawberry.enum
class QueryOperator(Enum):
    EQ = "EQ"
    NEQ = "NEQ"
    GT = "GT"
    GTE = "GTE"
    LT = "LT"
    LTE = "LTE"
    BETWEEN = "BETWEEN"
    IN = "IN"
    NOT_IN = "NOT_IN"
    CONTAINS = "CONTAINS"
    STARTS_WITH = "STARTS_WITH"
    ENDS_WITH = "ENDS_WITH"
    IS_NULL = "IS_NULL"
    IS_NOT_NULL = "IS_NOT_NULL"
    ANY_EQ = "ANY_EQ"
    ANY_IN = "ANY_IN"
    ALL_IN = "ALL_IN"
    NONE_IN = "NONE_IN"
    IS_EMPTY = "IS_EMPTY"
    IS_NOT_EMPTY = "IS_NOT_EMPTY"


@strawberry.enum
class QueryableFieldKind(Enum):
    SCALAR = "SCALAR"
    PROPERTY = "PROPERTY"
    REFERENCE = "REFERENCE"
    REFERENCE_LIST = "REFERENCE_LIST"
    CHOICE = "CHOICE"
    CHOICE_LIST = "CHOICE_LIST"


@strawberry.enum
class QueryableValueType(Enum):
    STRING = "STRING"
    NUMBER = "NUMBER"
    BOOLEAN = "BOOLEAN"
    DATE = "DATE"
    DATETIME = "DATETIME"
    UUID = "UUID"
    STRING_LIST = "STRING_LIST"
    UUID_LIST = "UUID_LIST"


@strawberry.enum
class ReferenceFilterMode(Enum):
    ID = "ID"
    LABEL = "LABEL"
