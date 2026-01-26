export enum Sex {
  Male = 'MALE',
  Female = 'FEMALE',
  Unknown = 'UNKNOWN',
}

export enum PatientState {
  Admitted = 'ADMITTED',
  Discharged = 'DISCHARGED',
  Dead = 'DEAD',
  Wait = 'WAIT',
}

export enum TaskPriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export enum LocationType {
  Bed = 'BED',
  Clinic = 'CLINIC',
  Hospital = 'HOSPITAL',
  Other = 'OTHER',
  Practice = 'PRACTICE',
  Room = 'ROOM',
  Team = 'TEAM',
  Ward = 'WARD',
}

export enum FieldType {
  FieldTypeText = 'FIELD_TYPE_TEXT',
  FieldTypeNumber = 'FIELD_TYPE_NUMBER',
  FieldTypeCheckbox = 'FIELD_TYPE_CHECKBOX',
  FieldTypeDate = 'FIELD_TYPE_DATE',
  FieldTypeDateTime = 'FIELD_TYPE_DATE_TIME',
  FieldTypeSelect = 'FIELD_TYPE_SELECT',
  FieldTypeMultiSelect = 'FIELD_TYPE_MULTI_SELECT',
  FieldTypeUnspecified = 'FIELD_TYPE_UNSPECIFIED',
}

export enum PropertyEntity {
  Patient = 'PATIENT',
  Task = 'TASK',
}

export interface PropertyValueInput {
  definitionId: string
  textValue?: string | null
  numberValue?: number | null
  booleanValue?: boolean | null
  dateValue?: string | null
  dateTimeValue?: string | null
  selectValue?: string | null
  multiSelectValues?: Array<string> | null
}

export interface FilterInput {
  column: string
  columnType?: string | null
  operator: string
  parameter: {
    compareDate?: string | null
    compareDateTime?: string | null
    compareValue?: number | null
    isCaseSensitive?: boolean
    max?: number | null
    maxDate?: string | null
    maxDateTime?: string | null
    min?: number | null
    minDate?: string | null
    minDateTime?: string | null
    propertyDefinitionId?: string | null
    searchTags?: Array<string> | null
    searchText?: string | null
  }
  propertyDefinitionId?: string | null
}

export interface SortInput {
  column: string
  direction: string
  propertyDefinitionId?: string | null
}

export interface PaginationInput {
  limit?: number | null
  offset?: number | null
}

export interface FullTextSearchInput {
  includeProperties?: boolean
  propertyDefinitionIds?: Array<string> | null
  searchColumns?: Array<string> | null
  searchText: string
}
