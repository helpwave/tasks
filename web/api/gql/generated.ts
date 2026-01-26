import { gql } from '@apollo/client/core';
import * as Apollo from '@apollo/client';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';

const skipToken = Symbol('skipToken') as any;
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
};

export type AuditLogType = {
  __typename?: 'AuditLogType';
  activity: Scalars['String']['output'];
  caseId: Scalars['String']['output'];
  context?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export enum ColumnType {
  DirectAttribute = 'DIRECT_ATTRIBUTE',
  Property = 'PROPERTY'
}

export type CreateLocationNodeInput = {
  kind: LocationType;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

export type CreatePatientInput = {
  assignedLocationId?: InputMaybe<Scalars['ID']['input']>;
  assignedLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  birthdate: Scalars['Date']['input'];
  clinicId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  firstname: Scalars['String']['input'];
  lastname: Scalars['String']['input'];
  positionId?: InputMaybe<Scalars['ID']['input']>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  sex: Sex;
  state?: InputMaybe<PatientState>;
  teamIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type CreatePropertyDefinitionInput = {
  allowedEntities: Array<PropertyEntity>;
  description?: InputMaybe<Scalars['String']['input']>;
  fieldType: FieldType;
  isActive?: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  options?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type CreateTaskInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  estimatedTime?: InputMaybe<Scalars['Int']['input']>;
  patientId: Scalars['ID']['input'];
  previousTaskIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  priority?: InputMaybe<TaskPriority>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  title: Scalars['String']['input'];
};

export enum FieldType {
  FieldTypeCheckbox = 'FIELD_TYPE_CHECKBOX',
  FieldTypeDate = 'FIELD_TYPE_DATE',
  FieldTypeDateTime = 'FIELD_TYPE_DATE_TIME',
  FieldTypeMultiSelect = 'FIELD_TYPE_MULTI_SELECT',
  FieldTypeNumber = 'FIELD_TYPE_NUMBER',
  FieldTypeSelect = 'FIELD_TYPE_SELECT',
  FieldTypeText = 'FIELD_TYPE_TEXT',
  FieldTypeUnspecified = 'FIELD_TYPE_UNSPECIFIED'
}

export type FilterInput = {
  column: Scalars['String']['input'];
  columnType?: ColumnType;
  operator: FilterOperator;
  parameter: FilterParameter;
  propertyDefinitionId?: InputMaybe<Scalars['String']['input']>;
};

export enum FilterOperator {
  BooleanIsFalse = 'BOOLEAN_IS_FALSE',
  BooleanIsTrue = 'BOOLEAN_IS_TRUE',
  DatetimeBetween = 'DATETIME_BETWEEN',
  DatetimeEquals = 'DATETIME_EQUALS',
  DatetimeGreaterThan = 'DATETIME_GREATER_THAN',
  DatetimeGreaterThanOrEqual = 'DATETIME_GREATER_THAN_OR_EQUAL',
  DatetimeLessThan = 'DATETIME_LESS_THAN',
  DatetimeLessThanOrEqual = 'DATETIME_LESS_THAN_OR_EQUAL',
  DatetimeNotBetween = 'DATETIME_NOT_BETWEEN',
  DatetimeNotEquals = 'DATETIME_NOT_EQUALS',
  DateBetween = 'DATE_BETWEEN',
  DateEquals = 'DATE_EQUALS',
  DateGreaterThan = 'DATE_GREATER_THAN',
  DateGreaterThanOrEqual = 'DATE_GREATER_THAN_OR_EQUAL',
  DateLessThan = 'DATE_LESS_THAN',
  DateLessThanOrEqual = 'DATE_LESS_THAN_OR_EQUAL',
  DateNotBetween = 'DATE_NOT_BETWEEN',
  DateNotEquals = 'DATE_NOT_EQUALS',
  IsNotNull = 'IS_NOT_NULL',
  IsNull = 'IS_NULL',
  NumberBetween = 'NUMBER_BETWEEN',
  NumberEquals = 'NUMBER_EQUALS',
  NumberGreaterThan = 'NUMBER_GREATER_THAN',
  NumberGreaterThanOrEqual = 'NUMBER_GREATER_THAN_OR_EQUAL',
  NumberLessThan = 'NUMBER_LESS_THAN',
  NumberLessThanOrEqual = 'NUMBER_LESS_THAN_OR_EQUAL',
  NumberNotBetween = 'NUMBER_NOT_BETWEEN',
  NumberNotEquals = 'NUMBER_NOT_EQUALS',
  TagsContains = 'TAGS_CONTAINS',
  TagsEquals = 'TAGS_EQUALS',
  TagsNotContains = 'TAGS_NOT_CONTAINS',
  TagsNotEquals = 'TAGS_NOT_EQUALS',
  TagsSingleContains = 'TAGS_SINGLE_CONTAINS',
  TagsSingleEquals = 'TAGS_SINGLE_EQUALS',
  TagsSingleNotContains = 'TAGS_SINGLE_NOT_CONTAINS',
  TagsSingleNotEquals = 'TAGS_SINGLE_NOT_EQUALS',
  TextContains = 'TEXT_CONTAINS',
  TextEndsWith = 'TEXT_ENDS_WITH',
  TextEquals = 'TEXT_EQUALS',
  TextNotContains = 'TEXT_NOT_CONTAINS',
  TextNotEquals = 'TEXT_NOT_EQUALS',
  TextNotWhitespace = 'TEXT_NOT_WHITESPACE',
  TextStartsWith = 'TEXT_STARTS_WITH'
}

export type FilterParameter = {
  compareDate?: InputMaybe<Scalars['Date']['input']>;
  compareDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  compareValue?: InputMaybe<Scalars['Float']['input']>;
  isCaseSensitive?: Scalars['Boolean']['input'];
  max?: InputMaybe<Scalars['Float']['input']>;
  maxDate?: InputMaybe<Scalars['Date']['input']>;
  maxDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  min?: InputMaybe<Scalars['Float']['input']>;
  minDate?: InputMaybe<Scalars['Date']['input']>;
  minDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  propertyDefinitionId?: InputMaybe<Scalars['String']['input']>;
  searchTags?: InputMaybe<Array<Scalars['String']['input']>>;
  searchText?: InputMaybe<Scalars['String']['input']>;
};

export type FullTextSearchInput = {
  includeProperties?: Scalars['Boolean']['input'];
  propertyDefinitionIds?: InputMaybe<Array<Scalars['String']['input']>>;
  searchColumns?: InputMaybe<Array<Scalars['String']['input']>>;
  searchText: Scalars['String']['input'];
};

export type LocationNodeType = {
  __typename?: 'LocationNodeType';
  children: Array<LocationNodeType>;
  id: Scalars['ID']['output'];
  kind: LocationType;
  organizationIds: Array<Scalars['String']['output']>;
  parent?: Maybe<LocationNodeType>;
  parentId?: Maybe<Scalars['ID']['output']>;
  patients: Array<PatientType>;
  title: Scalars['String']['output'];
};

export enum LocationType {
  Bed = 'BED',
  Clinic = 'CLINIC',
  Hospital = 'HOSPITAL',
  Other = 'OTHER',
  Practice = 'PRACTICE',
  Room = 'ROOM',
  Team = 'TEAM',
  Ward = 'WARD'
}

export type Mutation = {
  __typename?: 'Mutation';
  admitPatient: PatientType;
  assignTask: TaskType;
  assignTaskToTeam: TaskType;
  completeTask: TaskType;
  createLocationNode: LocationNodeType;
  createPatient: PatientType;
  createPropertyDefinition: PropertyDefinitionType;
  createTask: TaskType;
  deleteLocationNode: Scalars['Boolean']['output'];
  deletePatient: Scalars['Boolean']['output'];
  deletePropertyDefinition: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  dischargePatient: PatientType;
  markPatientDead: PatientType;
  reopenTask: TaskType;
  unassignTask: TaskType;
  unassignTaskFromTeam: TaskType;
  updateLocationNode: LocationNodeType;
  updatePatient: PatientType;
  updateProfilePicture: UserType;
  updatePropertyDefinition: PropertyDefinitionType;
  updateTask: TaskType;
  waitPatient: PatientType;
};


export type MutationAdmitPatientArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAssignTaskArgs = {
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAssignTaskToTeamArgs = {
  id: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationCompleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateLocationNodeArgs = {
  data: CreateLocationNodeInput;
};


export type MutationCreatePatientArgs = {
  data: CreatePatientInput;
};


export type MutationCreatePropertyDefinitionArgs = {
  data: CreatePropertyDefinitionInput;
};


export type MutationCreateTaskArgs = {
  data: CreateTaskInput;
};


export type MutationDeleteLocationNodeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePatientArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePropertyDefinitionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDischargePatientArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkPatientDeadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReopenTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnassignTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnassignTaskFromTeamArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateLocationNodeArgs = {
  data: UpdateLocationNodeInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdatePatientArgs = {
  data: UpdatePatientInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateProfilePictureArgs = {
  data: UpdateProfilePictureInput;
};


export type MutationUpdatePropertyDefinitionArgs = {
  data: UpdatePropertyDefinitionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateTaskArgs = {
  data: UpdateTaskInput;
  id: Scalars['ID']['input'];
};


export type MutationWaitPatientArgs = {
  id: Scalars['ID']['input'];
};

export type PaginationInput = {
  pageIndex?: Scalars['Int']['input'];
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export enum PatientState {
  Admitted = 'ADMITTED',
  Dead = 'DEAD',
  Discharged = 'DISCHARGED',
  Wait = 'WAIT'
}

export type PatientType = {
  __typename?: 'PatientType';
  age: Scalars['Int']['output'];
  assignedLocation?: Maybe<LocationNodeType>;
  assignedLocationId?: Maybe<Scalars['ID']['output']>;
  assignedLocations: Array<LocationNodeType>;
  birthdate: Scalars['Date']['output'];
  checksum: Scalars['String']['output'];
  clinic: LocationNodeType;
  clinicId: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  firstname: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastname: Scalars['String']['output'];
  name: Scalars['String']['output'];
  position?: Maybe<LocationNodeType>;
  positionId?: Maybe<Scalars['ID']['output']>;
  properties: Array<PropertyValueType>;
  sex: Sex;
  state: PatientState;
  tasks: Array<TaskType>;
  teams: Array<LocationNodeType>;
};


export type PatientTypeTasksArgs = {
  done?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PatientsResponse = {
  __typename?: 'PatientsResponse';
  data: Array<PatientType>;
  totalCount: Scalars['Int']['output'];
};

export type PropertyDefinitionType = {
  __typename?: 'PropertyDefinitionType';
  allowedEntities: Array<PropertyEntity>;
  description?: Maybe<Scalars['String']['output']>;
  fieldType: FieldType;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  options: Array<Scalars['String']['output']>;
};

export enum PropertyEntity {
  Patient = 'PATIENT',
  Task = 'TASK'
}

export type PropertyValueInput = {
  booleanValue?: InputMaybe<Scalars['Boolean']['input']>;
  dateTimeValue?: InputMaybe<Scalars['DateTime']['input']>;
  dateValue?: InputMaybe<Scalars['Date']['input']>;
  definitionId: Scalars['ID']['input'];
  multiSelectValues?: InputMaybe<Array<Scalars['String']['input']>>;
  numberValue?: InputMaybe<Scalars['Float']['input']>;
  selectValue?: InputMaybe<Scalars['String']['input']>;
  textValue?: InputMaybe<Scalars['String']['input']>;
};

export type PropertyValueType = {
  __typename?: 'PropertyValueType';
  booleanValue?: Maybe<Scalars['Boolean']['output']>;
  dateTimeValue?: Maybe<Scalars['DateTime']['output']>;
  dateValue?: Maybe<Scalars['Date']['output']>;
  definition: PropertyDefinitionType;
  multiSelectValues?: Maybe<Array<Scalars['String']['output']>>;
  numberValue?: Maybe<Scalars['Float']['output']>;
  selectValue?: Maybe<Scalars['String']['output']>;
  textValue?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  auditLogs: Array<AuditLogType>;
  locationNode?: Maybe<LocationNodeType>;
  locationNodes: Array<LocationNodeType>;
  locationRoots: Array<LocationNodeType>;
  me?: Maybe<UserType>;
  patient?: Maybe<PatientType>;
  patients: PatientsResponse;
  propertyDefinitions: Array<PropertyDefinitionType>;
  recentPatients: Array<PatientType>;
  recentTasks: Array<TaskType>;
  task?: Maybe<TaskType>;
  tasks: TasksResponse;
  user?: Maybe<UserType>;
  users: Array<UserType>;
};


export type QueryAuditLogsArgs = {
  caseId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLocationNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLocationNodesArgs = {
  kind?: InputMaybe<LocationType>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderByName?: Scalars['Boolean']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  recursive?: Scalars['Boolean']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPatientArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPatientsArgs = {
  filtering?: InputMaybe<Array<FilterInput>>;
  locationNodeId?: InputMaybe<Scalars['ID']['input']>;
  pagination?: InputMaybe<PaginationInput>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<FullTextSearchInput>;
  sorting?: InputMaybe<Array<SortInput>>;
  states?: InputMaybe<Array<PatientState>>;
};


export type QueryRecentPatientsArgs = {
  limit?: Scalars['Int']['input'];
};


export type QueryRecentTasksArgs = {
  limit?: Scalars['Int']['input'];
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  filtering?: InputMaybe<Array<FilterInput>>;
  pagination?: InputMaybe<PaginationInput>;
  patientId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<FullTextSearchInput>;
  sorting?: InputMaybe<Array<SortInput>>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  filtering?: InputMaybe<Array<FilterInput>>;
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<FullTextSearchInput>;
  sorting?: InputMaybe<Array<SortInput>>;
};

export enum Sex {
  Female = 'FEMALE',
  Male = 'MALE',
  Unknown = 'UNKNOWN'
}

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type SortInput = {
  column: Scalars['String']['input'];
  columnType?: ColumnType;
  direction: SortDirection;
  propertyDefinitionId?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  locationNodeCreated: Scalars['ID']['output'];
  locationNodeDeleted: Scalars['ID']['output'];
  locationNodeUpdated: Scalars['ID']['output'];
  patientCreated: Scalars['ID']['output'];
  patientDeleted: Scalars['ID']['output'];
  patientStateChanged: Scalars['ID']['output'];
  patientUpdated: Scalars['ID']['output'];
  taskCreated: Scalars['ID']['output'];
  taskDeleted: Scalars['ID']['output'];
  taskUpdated: Scalars['ID']['output'];
};


export type SubscriptionLocationNodeUpdatedArgs = {
  locationId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionPatientCreatedArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type SubscriptionPatientDeletedArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type SubscriptionPatientStateChangedArgs = {
  patientId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type SubscriptionPatientUpdatedArgs = {
  patientId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type SubscriptionTaskCreatedArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type SubscriptionTaskDeletedArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type SubscriptionTaskUpdatedArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  taskId?: InputMaybe<Scalars['ID']['input']>;
};

export enum TaskPriority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4'
}

export type TaskType = {
  __typename?: 'TaskType';
  assignee?: Maybe<UserType>;
  assigneeId?: Maybe<Scalars['ID']['output']>;
  assigneeTeam?: Maybe<LocationNodeType>;
  assigneeTeamId?: Maybe<Scalars['ID']['output']>;
  checksum: Scalars['String']['output'];
  creationDate: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  done: Scalars['Boolean']['output'];
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  estimatedTime?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  patient: PatientType;
  patientId: Scalars['ID']['output'];
  priority?: Maybe<Scalars['String']['output']>;
  properties: Array<PropertyValueType>;
  title: Scalars['String']['output'];
  updateDate?: Maybe<Scalars['DateTime']['output']>;
};

export type TasksResponse = {
  __typename?: 'TasksResponse';
  data: Array<TaskType>;
  totalCount: Scalars['Int']['output'];
};

export type UpdateLocationNodeInput = {
  kind?: InputMaybe<LocationType>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePatientInput = {
  assignedLocationId?: InputMaybe<Scalars['ID']['input']>;
  assignedLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  birthdate?: InputMaybe<Scalars['Date']['input']>;
  checksum?: InputMaybe<Scalars['String']['input']>;
  clinicId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  firstname?: InputMaybe<Scalars['String']['input']>;
  lastname?: InputMaybe<Scalars['String']['input']>;
  positionId?: InputMaybe<Scalars['ID']['input']>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  sex?: InputMaybe<Sex>;
  teamIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type UpdateProfilePictureInput = {
  avatarUrl: Scalars['String']['input'];
};

export type UpdatePropertyDefinitionInput = {
  allowedEntities?: InputMaybe<Array<PropertyEntity>>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateTaskInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  checksum?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  estimatedTime?: InputMaybe<Scalars['Int']['input']>;
  previousTaskIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  priority?: InputMaybe<TaskPriority>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UserType = {
  __typename?: 'UserType';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstname?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isOnline: Scalars['Boolean']['output'];
  lastOnline?: Maybe<Scalars['DateTime']['output']>;
  lastname?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  organizations?: Maybe<Scalars['String']['output']>;
  rootLocations: Array<LocationNodeType>;
  tasks: Array<TaskType>;
  title?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};


export type UserTypeTasksArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type GetAuditLogsQueryVariables = Exact<{
  caseId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAuditLogsQuery = { __typename?: 'Query', auditLogs: Array<{ __typename?: 'AuditLogType', caseId: string, activity: string, userId?: string | null, timestamp: any, context?: string | null }> };

export type GetLocationNodeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetLocationNodeQuery = { __typename?: 'Query', locationNode?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parentId?: string | null, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parentId?: string | null, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parentId?: string | null, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parentId?: string | null, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parentId?: string | null } | null } | null } | null } | null } | null };

export type GetLocationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetLocationsQuery = { __typename?: 'Query', locationNodes: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parentId?: string | null }> };

export type GetMyTasksQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTasksQuery = { __typename?: 'Query', me?: { __typename?: 'UserType', id: string, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, creationDate: any, updateDate?: any | null, patient: { __typename?: 'PatientType', id: string, name: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null }> }, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null }> } | null };

export type GetOverviewDataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOverviewDataQuery = { __typename?: 'Query', recentPatients: Array<{ __typename?: 'PatientType', id: string, name: string, sex: Sex, birthdate: any, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, tasks: Array<{ __typename?: 'TaskType', updateDate?: any | null }> }>, recentTasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, updateDate?: any | null, priority?: string | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, patient: { __typename?: 'PatientType', id: string, name: string, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } }> };

export type GetPatientQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPatientQuery = { __typename?: 'Query', patient?: { __typename?: 'PatientType', id: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, description?: string | null, checksum: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }>, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, updateDate?: any | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }>, properties: Array<{ __typename?: 'PropertyValueType', textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } }> } | null };

export type GetPatientsQueryVariables = Exact<{
  locationId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  states?: InputMaybe<Array<PatientState> | PatientState>;
  filtering?: InputMaybe<Array<FilterInput> | FilterInput>;
  sorting?: InputMaybe<Array<SortInput> | SortInput>;
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<FullTextSearchInput>;
}>;


export type GetPatientsQuery = { __typename?: 'Query', patients: { __typename?: 'PatientsResponse', totalCount: number, data: Array<{ __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }>, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, creationDate: any, updateDate?: any | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }>, properties: Array<{ __typename?: 'PropertyValueType', textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } }> }> } };

export type GetTaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTaskQuery = { __typename?: 'Query', task?: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, checksum: string, patient: { __typename?: 'PatientType', id: string, name: string }, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, properties: Array<{ __typename?: 'PropertyValueType', textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } }> } | null };

export type GetTasksQueryVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  filtering?: InputMaybe<Array<FilterInput> | FilterInput>;
  sorting?: InputMaybe<Array<SortInput> | SortInput>;
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<FullTextSearchInput>;
}>;


export type GetTasksQuery = { __typename?: 'Query', tasks: { __typename?: 'TasksResponse', totalCount: number, data: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, creationDate: any, updateDate?: any | null, patient: { __typename?: 'PatientType', id: string, name: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null }> }, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, properties: Array<{ __typename?: 'PropertyValueType', textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } }> }> } };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'UserType', id: string, username: string, name: string, email?: string | null, firstname?: string | null, lastname?: string | null, title?: string | null, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null };

export type GetUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }> };

export type GetGlobalDataQueryVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type GetGlobalDataQuery = { __typename?: 'Query', me?: { __typename?: 'UserType', id: string, username: string, name: string, firstname?: string | null, lastname?: string | null, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean, organizations?: string | null, rootLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }>, tasks: Array<{ __typename?: 'TaskType', id: string, done: boolean }> } | null, wards: Array<{ __typename?: 'LocationNodeType', id: string, title: string, parentId?: string | null }>, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, parentId?: string | null }>, clinics: Array<{ __typename?: 'LocationNodeType', id: string, title: string, parentId?: string | null }>, patients: { __typename?: 'PatientsResponse', data: Array<{ __typename?: 'PatientType', id: string, state: PatientState, assignedLocation?: { __typename?: 'LocationNodeType', id: string } | null }> }, waitingPatients: { __typename?: 'PatientsResponse', data: Array<{ __typename?: 'PatientType', id: string, state: PatientState }> } };

export type CreatePatientMutationVariables = Exact<{
  data: CreatePatientInput;
}>;


export type CreatePatientMutation = { __typename?: 'Mutation', createPatient: { __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }> } };

export type UpdatePatientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdatePatientInput;
}>;


export type UpdatePatientMutation = { __typename?: 'Mutation', updatePatient: { __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, checksum: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }>, properties: Array<{ __typename?: 'PropertyValueType', textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } }> } };

export type AdmitPatientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdmitPatientMutation = { __typename?: 'Mutation', admitPatient: { __typename?: 'PatientType', id: string, state: PatientState } };

export type DischargePatientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DischargePatientMutation = { __typename?: 'Mutation', dischargePatient: { __typename?: 'PatientType', id: string, state: PatientState } };

export type MarkPatientDeadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MarkPatientDeadMutation = { __typename?: 'Mutation', markPatientDead: { __typename?: 'PatientType', id: string, state: PatientState } };

export type WaitPatientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WaitPatientMutation = { __typename?: 'Mutation', waitPatient: { __typename?: 'PatientType', id: string, state: PatientState } };

export type DeletePatientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePatientMutation = { __typename?: 'Mutation', deletePatient: boolean };

export type CreatePropertyDefinitionMutationVariables = Exact<{
  data: CreatePropertyDefinitionInput;
}>;


export type CreatePropertyDefinitionMutation = { __typename?: 'Mutation', createPropertyDefinition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } };

export type UpdatePropertyDefinitionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdatePropertyDefinitionInput;
}>;


export type UpdatePropertyDefinitionMutation = { __typename?: 'Mutation', updatePropertyDefinition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } };

export type DeletePropertyDefinitionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePropertyDefinitionMutation = { __typename?: 'Mutation', deletePropertyDefinition: boolean };

export type GetPropertyDefinitionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPropertyDefinitionsQuery = { __typename?: 'Query', propertyDefinitions: Array<{ __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }> };

export type GetPropertiesForSubjectQueryVariables = Exact<{
  subjectId: Scalars['ID']['input'];
  subjectType: PropertyEntity;
}>;


export type GetPropertiesForSubjectQuery = { __typename?: 'Query', propertyDefinitions: Array<{ __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }> };

export type PatientCreatedSubscriptionVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type PatientCreatedSubscription = { __typename?: 'Subscription', patientCreated: string };

export type PatientUpdatedSubscriptionVariables = Exact<{
  patientId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type PatientUpdatedSubscription = { __typename?: 'Subscription', patientUpdated: string };

export type PatientStateChangedSubscriptionVariables = Exact<{
  patientId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type PatientStateChangedSubscription = { __typename?: 'Subscription', patientStateChanged: string };

export type TaskCreatedSubscriptionVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type TaskCreatedSubscription = { __typename?: 'Subscription', taskCreated: string };

export type TaskUpdatedSubscriptionVariables = Exact<{
  taskId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type TaskUpdatedSubscription = { __typename?: 'Subscription', taskUpdated: string };

export type TaskDeletedSubscriptionVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type TaskDeletedSubscription = { __typename?: 'Subscription', taskDeleted: string };

export type LocationNodeUpdatedSubscriptionVariables = Exact<{
  locationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type LocationNodeUpdatedSubscription = { __typename?: 'Subscription', locationNodeUpdated: string };

export type LocationNodeCreatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type LocationNodeCreatedSubscription = { __typename?: 'Subscription', locationNodeCreated: string };

export type LocationNodeDeletedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type LocationNodeDeletedSubscription = { __typename?: 'Subscription', locationNodeDeleted: string };

export type CreateTaskMutationVariables = Exact<{
  data: CreateTaskInput;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, updateDate?: any | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, patient: { __typename?: 'PatientType', id: string, name: string } } };

export type UpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, updateDate?: any | null, checksum: string, patient: { __typename?: 'PatientType', id: string, name: string }, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, properties: Array<{ __typename?: 'PropertyValueType', textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> } }> } };

export type AssignTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
}>;


export type AssignTaskMutation = { __typename?: 'Mutation', assignTask: { __typename?: 'TaskType', id: string, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null } };

export type UnassignTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnassignTaskMutation = { __typename?: 'Mutation', unassignTask: { __typename?: 'TaskType', id: string, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null } };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask: boolean };

export type CompleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CompleteTaskMutation = { __typename?: 'Mutation', completeTask: { __typename?: 'TaskType', id: string, done: boolean, updateDate?: any | null } };

export type ReopenTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ReopenTaskMutation = { __typename?: 'Mutation', reopenTask: { __typename?: 'TaskType', id: string, done: boolean, updateDate?: any | null } };

export type AssignTaskToTeamMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
}>;


export type AssignTaskToTeamMutation = { __typename?: 'Mutation', assignTaskToTeam: { __typename?: 'TaskType', id: string, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null } };

export type UnassignTaskFromTeamMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnassignTaskFromTeamMutation = { __typename?: 'Mutation', unassignTaskFromTeam: { __typename?: 'TaskType', id: string, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null } };

export type UpdateProfilePictureMutationVariables = Exact<{
  data: UpdateProfilePictureInput;
}>;


export type UpdateProfilePictureMutation = { __typename?: 'Mutation', updateProfilePicture: { __typename?: 'UserType', id: string, username: string, name: string, email?: string | null, firstname?: string | null, lastname?: string | null, title?: string | null, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } };


export const GetAuditLogsDocument = gql`
    query GetAuditLogs($caseId: ID!, $limit: Int, $offset: Int) {
  auditLogs(caseId: $caseId, limit: $limit, offset: $offset) {
    caseId
    activity
    userId
    timestamp
    context
  }
}
    `;

/**
 * __useGetAuditLogsQuery__
 *
 * To run a query within a React component, call `useGetAuditLogsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAuditLogsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAuditLogsQuery({
 *   variables: {
 *      caseId: // value for 'caseId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetAuditLogsQuery(baseOptions: Parameters<typeof import('@apollo/client/react').useQuery<GetAuditLogsQuery, GetAuditLogsQueryVariables>>[1] & ({ variables: GetAuditLogsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetAuditLogsQuery, GetAuditLogsQueryVariables>(GetAuditLogsDocument, options);
      }
export function useGetAuditLogsLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetAuditLogsQuery, GetAuditLogsQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetAuditLogsQuery, GetAuditLogsQueryVariables>(GetAuditLogsDocument, options);
        }
// @ts-ignore
export function useGetAuditLogsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetAuditLogsQuery, GetAuditLogsQueryVariables>): Apollo.UseSuspenseQueryResult<GetAuditLogsQuery, GetAuditLogsQueryVariables>;
export function useGetAuditLogsSuspenseQuery(_baseOptions?: any): any {
          return null as any;
        }
export type GetAuditLogsQueryHookResult = ReturnType<typeof useGetAuditLogsQuery>;
export type GetAuditLogsLazyQueryHookResult = ReturnType<typeof useGetAuditLogsLazyQuery>;
export type GetAuditLogsSuspenseQueryHookResult = ReturnType<typeof useGetAuditLogsSuspenseQuery>;
export type GetAuditLogsQueryResult = any;
export const GetLocationNodeDocument = gql`
    query GetLocationNode($id: ID!) {
  locationNode(id: $id) {
    id
    title
    kind
    parentId
    parent {
      id
      title
      kind
      parentId
      parent {
        id
        title
        kind
        parentId
        parent {
          id
          title
          kind
          parentId
          parent {
            id
            title
            kind
            parentId
          }
        }
      }
    }
  }
}
    `;

/**
 * __useGetLocationNodeQuery__
 *
 * To run a query within a React component, call `useGetLocationNodeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLocationNodeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLocationNodeQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetLocationNodeQuery(baseOptions: Parameters<typeof import('@apollo/client/react').useQuery<GetLocationNodeQuery, GetLocationNodeQueryVariables>>[1] & ({ variables: GetLocationNodeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetLocationNodeQuery, GetLocationNodeQueryVariables>(GetLocationNodeDocument, options);
      }
export function useGetLocationNodeLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetLocationNodeQuery, GetLocationNodeQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetLocationNodeQuery, GetLocationNodeQueryVariables>(GetLocationNodeDocument, options);
        }
// @ts-ignore
export function useGetLocationNodeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetLocationNodeQuery, GetLocationNodeQueryVariables>): Apollo.UseSuspenseQueryResult<GetLocationNodeQuery, GetLocationNodeQueryVariables>;
export function useGetLocationNodeSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetLocationNodeQuery, GetLocationNodeQueryVariables>): Apollo.UseSuspenseQueryResult<GetLocationNodeQuery | undefined, GetLocationNodeQueryVariables>;
export function useGetLocationNodeSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetLocationNodeQuery, GetLocationNodeQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetLocationNodeQuery, GetLocationNodeQueryVariables>(GetLocationNodeDocument, options);
        }
export type GetLocationNodeQueryHookResult = ReturnType<typeof useGetLocationNodeQuery>;
export type GetLocationNodeLazyQueryHookResult = ReturnType<typeof useGetLocationNodeLazyQuery>;
export type GetLocationNodeSuspenseQueryHookResult = ReturnType<typeof useGetLocationNodeSuspenseQuery>;
export type GetLocationNodeQueryResult = anyGetLocationNodeQuery, GetLocationNodeQueryVariables>;
export const GetLocationsDocument = gql`
    query GetLocations($limit: Int, $offset: Int) {
  locationNodes(limit: $limit, offset: $offset) {
    id
    title
    kind
    parentId
  }
}
    `;

/**
 * __useGetLocationsQuery__
 *
 * To run a query within a React component, call `useGetLocationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLocationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLocationsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetLocationsQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetLocationsQuery, GetLocationsQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetLocationsQuery, GetLocationsQueryVariables>(GetLocationsDocument, options);
      }
export function useGetLocationsLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetLocationsQuery, GetLocationsQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetLocationsQuery, GetLocationsQueryVariables>(GetLocationsDocument, options);
        }
// @ts-ignore
export function useGetLocationsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetLocationsQuery, GetLocationsQueryVariables>): Apollo.UseSuspenseQueryResult<GetLocationsQuery, GetLocationsQueryVariables>;
export function useGetLocationsSuspenseQuery(_baseOptions?: any): any {
          return null as any;
        }
export type GetLocationsQueryHookResult = ReturnType<typeof useGetLocationsQuery>;
export type GetLocationsLazyQueryHookResult = ReturnType<typeof useGetLocationsLazyQuery>;
export type GetLocationsSuspenseQueryHookResult = ReturnType<typeof useGetLocationsSuspenseQuery>;
export type GetLocationsQueryResult = anyGetLocationsQuery, GetLocationsQueryVariables>;
export const GetMyTasksDocument = gql`
    query GetMyTasks {
  me {
    id
    tasks {
      id
      title
      description
      done
      dueDate
      priority
      estimatedTime
      creationDate
      updateDate
      patient {
        id
        name
        assignedLocation {
          id
          title
          parent {
            id
            title
          }
        }
        assignedLocations {
          id
          title
          kind
          parent {
            id
            title
            parent {
              id
              title
            }
          }
        }
      }
      assignee {
        id
        name
        avatarUrl
        lastOnline
        isOnline
      }
    }
  }
}
    `;

/**
 * __useGetMyTasksQuery__
 *
 * To run a query within a React component, call `useGetMyTasksQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyTasksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyTasksQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMyTasksQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetMyTasksQuery, GetMyTasksQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetMyTasksQuery, GetMyTasksQueryVariables>(GetMyTasksDocument, options);
      }
export function useGetMyTasksLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetMyTasksQuery, GetMyTasksQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetMyTasksQuery, GetMyTasksQueryVariables>(GetMyTasksDocument, options);
        }
// @ts-ignore
export function useGetMyTasksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMyTasksQuery, GetMyTasksQueryVariables>): Apollo.UseSuspenseQueryResult<GetMyTasksQuery, GetMyTasksQueryVariables>;
export function useGetMyTasksSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetMyTasksQuery, GetMyTasksQueryVariables>): Apollo.UseSuspenseQueryResult<GetMyTasksQuery | undefined, GetMyTasksQueryVariables>;
export function useGetMyTasksSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetMyTasksQuery, GetMyTasksQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMyTasksQuery, GetMyTasksQueryVariables>(GetMyTasksDocument, options);
        }
export type GetMyTasksQueryHookResult = ReturnType<typeof useGetMyTasksQuery>;
export type GetMyTasksLazyQueryHookResult = ReturnType<typeof useGetMyTasksLazyQuery>;
export type GetMyTasksSuspenseQueryHookResult = ReturnType<typeof useGetMyTasksSuspenseQuery>;
export type GetMyTasksQueryResult = anyGetMyTasksQuery, GetMyTasksQueryVariables>;
export const GetOverviewDataDocument = gql`
    query GetOverviewData {
  recentPatients(limit: 5) {
    id
    name
    sex
    birthdate
    position {
      id
      title
      kind
      parent {
        id
        title
      }
    }
    tasks {
      updateDate
    }
  }
  recentTasks(limit: 10) {
    id
    title
    description
    done
    dueDate
    updateDate
    priority
    assignee {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
    patient {
      id
      name
      position {
        id
        title
        kind
        parent {
          id
          title
        }
      }
    }
  }
}
    `;

/**
 * __useGetOverviewDataQuery__
 *
 * To run a query within a React component, call `useGetOverviewDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOverviewDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOverviewDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetOverviewDataQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetOverviewDataQuery, GetOverviewDataQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetOverviewDataQuery, GetOverviewDataQueryVariables>(GetOverviewDataDocument, options);
      }
export function useGetOverviewDataLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetOverviewDataQuery, GetOverviewDataQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetOverviewDataQuery, GetOverviewDataQueryVariables>(GetOverviewDataDocument, options);
        }
// @ts-ignore
export function useGetOverviewDataSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetOverviewDataQuery, GetOverviewDataQueryVariables>): Apollo.UseSuspenseQueryResult<GetOverviewDataQuery, GetOverviewDataQueryVariables>;
export function useGetOverviewDataSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetOverviewDataQuery, GetOverviewDataQueryVariables>): Apollo.UseSuspenseQueryResult<GetOverviewDataQuery | undefined, GetOverviewDataQueryVariables>;
export function useGetOverviewDataSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetOverviewDataQuery, GetOverviewDataQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetOverviewDataQuery, GetOverviewDataQueryVariables>(GetOverviewDataDocument, options);
        }
export type GetOverviewDataQueryHookResult = ReturnType<typeof useGetOverviewDataQuery>;
export type GetOverviewDataLazyQueryHookResult = ReturnType<typeof useGetOverviewDataLazyQuery>;
export type GetOverviewDataSuspenseQueryHookResult = ReturnType<typeof useGetOverviewDataSuspenseQuery>;
export type GetOverviewDataQueryResult = anyGetOverviewDataQuery, GetOverviewDataQueryVariables>;
export const GetPatientDocument = gql`
    query GetPatient($id: ID!) {
  patient(id: $id) {
    id
    firstname
    lastname
    birthdate
    sex
    state
    description
    checksum
    assignedLocation {
      id
      title
    }
    assignedLocations {
      id
      title
    }
    clinic {
      id
      title
      kind
      parent {
        id
        title
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
            }
          }
        }
      }
    }
    position {
      id
      title
      kind
      parent {
        id
        title
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
            }
          }
        }
      }
    }
    teams {
      id
      title
      kind
      parent {
        id
        title
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
            }
          }
        }
      }
    }
    tasks {
      id
      title
      description
      done
      dueDate
      priority
      estimatedTime
      updateDate
      assignee {
        id
        name
        avatarUrl
        lastOnline
        isOnline
      }
      assigneeTeam {
        id
        title
        kind
      }
    }
    properties {
      definition {
        id
        name
        description
        fieldType
        isActive
        allowedEntities
        options
      }
      textValue
      numberValue
      booleanValue
      dateValue
      dateTimeValue
      selectValue
      multiSelectValues
    }
  }
}
    `;

/**
 * __useGetPatientQuery__
 *
 * To run a query within a React component, call `useGetPatientQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPatientQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPatientQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPatientQuery(baseOptions: Parameters<typeof import('@apollo/client/react').useQuery<GetPatientQuery, GetPatientQueryVariables>>[1] & ({ variables: GetPatientQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetPatientQuery, GetPatientQueryVariables>(GetPatientDocument, options);
      }
export function useGetPatientLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetPatientQuery, GetPatientQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetPatientQuery, GetPatientQueryVariables>(GetPatientDocument, options);
        }
// @ts-ignore
export function useGetPatientSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPatientQuery, GetPatientQueryVariables>): Apollo.UseSuspenseQueryResult<GetPatientQuery, GetPatientQueryVariables>;
export function useGetPatientSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPatientQuery, GetPatientQueryVariables>): Apollo.UseSuspenseQueryResult<GetPatientQuery | undefined, GetPatientQueryVariables>;
export function useGetPatientSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPatientQuery, GetPatientQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPatientQuery, GetPatientQueryVariables>(GetPatientDocument, options);
        }
export type GetPatientQueryHookResult = ReturnType<typeof useGetPatientQuery>;
export type GetPatientLazyQueryHookResult = ReturnType<typeof useGetPatientLazyQuery>;
export type GetPatientSuspenseQueryHookResult = ReturnType<typeof useGetPatientSuspenseQuery>;
export type GetPatientQueryResult = anyGetPatientQuery, GetPatientQueryVariables>;
export const GetPatientsDocument = gql`
    query GetPatients($locationId: ID, $rootLocationIds: [ID!], $states: [PatientState!], $filtering: [FilterInput!], $sorting: [SortInput!], $pagination: PaginationInput, $search: FullTextSearchInput) {
  patients(
    locationNodeId: $locationId
    rootLocationIds: $rootLocationIds
    states: $states
    filtering: $filtering
    sorting: $sorting
    pagination: $pagination
    search: $search
  ) {
    data {
      id
      name
      firstname
      lastname
      birthdate
      sex
      state
      assignedLocation {
        id
        title
        parent {
          id
          title
        }
      }
      assignedLocations {
        id
        title
        kind
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
            }
          }
        }
      }
      clinic {
        id
        title
        kind
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
              }
            }
          }
        }
      }
      position {
        id
        title
        kind
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
              }
            }
          }
        }
      }
      teams {
        id
        title
        kind
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
              }
            }
          }
        }
      }
      tasks {
        id
        title
        description
        done
        dueDate
        priority
        estimatedTime
        creationDate
        updateDate
        assignee {
          id
          name
          avatarUrl
          lastOnline
          isOnline
        }
        assigneeTeam {
          id
          title
          kind
        }
      }
      properties {
        definition {
          id
          name
          description
          fieldType
          isActive
          allowedEntities
          options
        }
        textValue
        numberValue
        booleanValue
        dateValue
        dateTimeValue
        selectValue
        multiSelectValues
      }
    }
    totalCount
  }
}
    `;

/**
 * __useGetPatientsQuery__
 *
 * To run a query within a React component, call `useGetPatientsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPatientsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPatientsQuery({
 *   variables: {
 *      locationId: // value for 'locationId'
 *      rootLocationIds: // value for 'rootLocationIds'
 *      states: // value for 'states'
 *      filtering: // value for 'filtering'
 *      sorting: // value for 'sorting'
 *      pagination: // value for 'pagination'
 *      search: // value for 'search'
 *   },
 * });
 */
export function useGetPatientsQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetPatientsQuery, GetPatientsQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetPatientsQuery, GetPatientsQueryVariables>(GetPatientsDocument, options);
      }
export function useGetPatientsLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetPatientsQuery, GetPatientsQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetPatientsQuery, GetPatientsQueryVariables>(GetPatientsDocument, options);
        }
// @ts-ignore
export function useGetPatientsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPatientsQuery, GetPatientsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPatientsQuery, GetPatientsQueryVariables>;
export function useGetPatientsSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPatientsQuery, GetPatientsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPatientsQuery | undefined, GetPatientsQueryVariables>;
export function useGetPatientsSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPatientsQuery, GetPatientsQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPatientsQuery, GetPatientsQueryVariables>(GetPatientsDocument, options);
        }
export type GetPatientsQueryHookResult = ReturnType<typeof useGetPatientsQuery>;
export type GetPatientsLazyQueryHookResult = ReturnType<typeof useGetPatientsLazyQuery>;
export type GetPatientsSuspenseQueryHookResult = ReturnType<typeof useGetPatientsSuspenseQuery>;
export type GetPatientsQueryResult = anyGetPatientsQuery, GetPatientsQueryVariables>;
export const GetTaskDocument = gql`
    query GetTask($id: ID!) {
  task(id: $id) {
    id
    title
    description
    done
    dueDate
    priority
    estimatedTime
    checksum
    patient {
      id
      name
    }
    assignee {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
    assigneeTeam {
      id
      title
      kind
    }
    properties {
      definition {
        id
        name
        description
        fieldType
        isActive
        allowedEntities
        options
      }
      textValue
      numberValue
      booleanValue
      dateValue
      dateTimeValue
      selectValue
      multiSelectValues
    }
  }
}
    `;

/**
 * __useGetTaskQuery__
 *
 * To run a query within a React component, call `useGetTaskQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTaskQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTaskQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetTaskQuery(baseOptions: Parameters<typeof import('@apollo/client/react').useQuery<GetTaskQuery, GetTaskQueryVariables>>[1] & ({ variables: GetTaskQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, options);
      }
export function useGetTaskLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetTaskQuery, GetTaskQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, options);
        }
// @ts-ignore
export function useGetTaskSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetTaskQuery, GetTaskQueryVariables>): Apollo.UseSuspenseQueryResult<GetTaskQuery, GetTaskQueryVariables>;
export function useGetTaskSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetTaskQuery, GetTaskQueryVariables>): Apollo.UseSuspenseQueryResult<GetTaskQuery | undefined, GetTaskQueryVariables>;
export function useGetTaskSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetTaskQuery, GetTaskQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, options);
        }
export type GetTaskQueryHookResult = ReturnType<typeof useGetTaskQuery>;
export type GetTaskLazyQueryHookResult = ReturnType<typeof useGetTaskLazyQuery>;
export type GetTaskSuspenseQueryHookResult = ReturnType<typeof useGetTaskSuspenseQuery>;
export type GetTaskQueryResult = anyGetTaskQuery, GetTaskQueryVariables>;
export const GetTasksDocument = gql`
    query GetTasks($rootLocationIds: [ID!], $assigneeId: ID, $assigneeTeamId: ID, $filtering: [FilterInput!], $sorting: [SortInput!], $pagination: PaginationInput, $search: FullTextSearchInput) {
  tasks(
    rootLocationIds: $rootLocationIds
    assigneeId: $assigneeId
    assigneeTeamId: $assigneeTeamId
    filtering: $filtering
    sorting: $sorting
    pagination: $pagination
    search: $search
  ) {
    data {
      id
      title
      description
      done
      dueDate
      priority
      estimatedTime
      creationDate
      updateDate
      patient {
        id
        name
        assignedLocation {
          id
          title
          parent {
            id
            title
          }
        }
        assignedLocations {
          id
          title
          kind
          parent {
            id
            title
            parent {
              id
              title
            }
          }
        }
      }
      assignee {
        id
        name
        avatarUrl
        lastOnline
        isOnline
      }
      assigneeTeam {
        id
        title
        kind
      }
      properties {
        definition {
          id
          name
          description
          fieldType
          isActive
          allowedEntities
          options
        }
        textValue
        numberValue
        booleanValue
        dateValue
        dateTimeValue
        selectValue
        multiSelectValues
      }
    }
    totalCount
  }
}
    `;

/**
 * __useGetTasksQuery__
 *
 * To run a query within a React component, call `useGetTasksQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTasksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTasksQuery({
 *   variables: {
 *      rootLocationIds: // value for 'rootLocationIds'
 *      assigneeId: // value for 'assigneeId'
 *      assigneeTeamId: // value for 'assigneeTeamId'
 *      filtering: // value for 'filtering'
 *      sorting: // value for 'sorting'
 *      pagination: // value for 'pagination'
 *      search: // value for 'search'
 *   },
 * });
 */
export function useGetTasksQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetTasksQuery, GetTasksQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, options);
      }
export function useGetTasksLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetTasksQuery, GetTasksQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, options);
        }
// @ts-ignore
export function useGetTasksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetTasksQuery, GetTasksQueryVariables>): Apollo.UseSuspenseQueryResult<GetTasksQuery, GetTasksQueryVariables>;
export function useGetTasksSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetTasksQuery, GetTasksQueryVariables>): Apollo.UseSuspenseQueryResult<GetTasksQuery | undefined, GetTasksQueryVariables>;
export function useGetTasksSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetTasksQuery, GetTasksQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, options);
        }
export type GetTasksQueryHookResult = ReturnType<typeof useGetTasksQuery>;
export type GetTasksLazyQueryHookResult = ReturnType<typeof useGetTasksLazyQuery>;
export type GetTasksSuspenseQueryHookResult = ReturnType<typeof useGetTasksSuspenseQuery>;
export type GetTasksQueryResult = anyGetTasksQuery, GetTasksQueryVariables>;
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  user(id: $id) {
    id
    username
    name
    email
    firstname
    lastname
    title
    avatarUrl
    lastOnline
    isOnline
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: Parameters<typeof import('@apollo/client/react').useQuery<GetUserQuery, GetUserQueryVariables>>[1] & ({ variables: GetUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetUserQuery, GetUserQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
// @ts-ignore
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery | undefined, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserSuspenseQueryHookResult = ReturnType<typeof useGetUserSuspenseQuery>;
export type GetUserQueryResult = anyGetUserQuery, GetUserQueryVariables>;
export const GetUsersDocument = gql`
    query GetUsers {
  users {
    id
    name
    avatarUrl
    lastOnline
    isOnline
  }
}
    `;

/**
 * __useGetUsersQuery__
 *
 * To run a query within a React component, call `useGetUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUsersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetUsersQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetUsersQuery, GetUsersQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
      }
export function useGetUsersLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetUsersQuery, GetUsersQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
// @ts-ignore
export function useGetUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): Apollo.UseSuspenseQueryResult<GetUsersQuery, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): Apollo.UseSuspenseQueryResult<GetUsersQuery | undefined, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
export type GetUsersQueryHookResult = ReturnType<typeof useGetUsersQuery>;
export type GetUsersLazyQueryHookResult = ReturnType<typeof useGetUsersLazyQuery>;
export type GetUsersSuspenseQueryHookResult = ReturnType<typeof useGetUsersSuspenseQuery>;
export type GetUsersQueryResult = anyGetUsersQuery, GetUsersQueryVariables>;
export const GetGlobalDataDocument = gql`
    query GetGlobalData($rootLocationIds: [ID!]) {
  me {
    id
    username
    name
    firstname
    lastname
    avatarUrl
    lastOnline
    isOnline
    organizations
    rootLocations {
      id
      title
      kind
    }
    tasks(rootLocationIds: $rootLocationIds) {
      id
      done
    }
  }
  wards: locationNodes(kind: WARD) {
    id
    title
    parentId
  }
  teams: locationNodes(kind: TEAM) {
    id
    title
    parentId
  }
  clinics: locationNodes(kind: CLINIC) {
    id
    title
    parentId
  }
  patients(rootLocationIds: $rootLocationIds) {
    data {
      id
      state
      assignedLocation {
        id
      }
    }
  }
  waitingPatients: patients(states: [WAIT], rootLocationIds: $rootLocationIds) {
    data {
      id
      state
    }
  }
}
    `;

/**
 * __useGetGlobalDataQuery__
 *
 * To run a query within a React component, call `useGetGlobalDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGlobalDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGlobalDataQuery({
 *   variables: {
 *      rootLocationIds: // value for 'rootLocationIds'
 *   },
 * });
 */
export function useGetGlobalDataQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetGlobalDataQuery, GetGlobalDataQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetGlobalDataQuery, GetGlobalDataQueryVariables>(GetGlobalDataDocument, options);
      }
export function useGetGlobalDataLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetGlobalDataQuery, GetGlobalDataQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetGlobalDataQuery, GetGlobalDataQueryVariables>(GetGlobalDataDocument, options);
        }
// @ts-ignore
export function useGetGlobalDataSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetGlobalDataQuery, GetGlobalDataQueryVariables>): Apollo.UseSuspenseQueryResult<GetGlobalDataQuery, GetGlobalDataQueryVariables>;
export function useGetGlobalDataSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetGlobalDataQuery, GetGlobalDataQueryVariables>): Apollo.UseSuspenseQueryResult<GetGlobalDataQuery | undefined, GetGlobalDataQueryVariables>;
export function useGetGlobalDataSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetGlobalDataQuery, GetGlobalDataQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetGlobalDataQuery, GetGlobalDataQueryVariables>(GetGlobalDataDocument, options);
        }
export type GetGlobalDataQueryHookResult = ReturnType<typeof useGetGlobalDataQuery>;
export type GetGlobalDataLazyQueryHookResult = ReturnType<typeof useGetGlobalDataLazyQuery>;
export type GetGlobalDataSuspenseQueryHookResult = ReturnType<typeof useGetGlobalDataSuspenseQuery>;
export type GetGlobalDataQueryResult = anyGetGlobalDataQuery, GetGlobalDataQueryVariables>;
export const CreatePatientDocument = gql`
    mutation CreatePatient($data: CreatePatientInput!) {
  createPatient(data: $data) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    state
    assignedLocation {
      id
      title
    }
    assignedLocations {
      id
      title
    }
    clinic {
      id
      title
      kind
    }
    position {
      id
      title
      kind
    }
    teams {
      id
      title
      kind
    }
  }
}
    `;
export type CreatePatientMutationFn = Apollo.MutationFunction<CreatePatientMutation, CreatePatientMutationVariables>;

/**
 * __useCreatePatientMutation__
 *
 * To run a mutation, you first call `useCreatePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPatientMutation, { data, loading, error }] = useCreatePatientMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreatePatientMutation(baseOptions?: import('@apollo/client').MutationOptions<CreatePatientMutation, CreatePatientMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<CreatePatientMutation, CreatePatientMutationVariables>(CreatePatientDocument, options);
      }
export type CreatePatientMutationHookResult = ReturnType<typeof useCreatePatientMutation>;
export type CreatePatientMutationResult = Apollo.MutationResult<CreatePatientMutation>;
export type CreatePatientMutationOptions = Apollo.BaseMutationOptions<CreatePatientMutation, CreatePatientMutationVariables>;
export const UpdatePatientDocument = gql`
    mutation UpdatePatient($id: ID!, $data: UpdatePatientInput!) {
  updatePatient(id: $id, data: $data) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    state
    checksum
    assignedLocation {
      id
      title
    }
    assignedLocations {
      id
      title
    }
    clinic {
      id
      title
      kind
    }
    position {
      id
      title
      kind
    }
    teams {
      id
      title
      kind
    }
    properties {
      definition {
        id
        name
        description
        fieldType
        isActive
        allowedEntities
        options
      }
      textValue
      numberValue
      booleanValue
      dateValue
      dateTimeValue
      selectValue
      multiSelectValues
    }
  }
}
    `;
export type UpdatePatientMutationFn = Apollo.MutationFunction<UpdatePatientMutation, UpdatePatientMutationVariables>;

/**
 * __useUpdatePatientMutation__
 *
 * To run a mutation, you first call `useUpdatePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePatientMutation, { data, loading, error }] = useUpdatePatientMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdatePatientMutation(baseOptions?: import('@apollo/client').MutationOptions<UpdatePatientMutation, UpdatePatientMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<UpdatePatientMutation, UpdatePatientMutationVariables>(UpdatePatientDocument, options);
      }
export type UpdatePatientMutationHookResult = ReturnType<typeof useUpdatePatientMutation>;
export type UpdatePatientMutationResult = Apollo.MutationResult<UpdatePatientMutation>;
export type UpdatePatientMutationOptions = Apollo.BaseMutationOptions<UpdatePatientMutation, UpdatePatientMutationVariables>;
export const AdmitPatientDocument = gql`
    mutation AdmitPatient($id: ID!) {
  admitPatient(id: $id) {
    id
    state
  }
}
    `;
export type AdmitPatientMutationFn = Apollo.MutationFunction<AdmitPatientMutation, AdmitPatientMutationVariables>;

/**
 * __useAdmitPatientMutation__
 *
 * To run a mutation, you first call `useAdmitPatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdmitPatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [admitPatientMutation, { data, loading, error }] = useAdmitPatientMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useAdmitPatientMutation(baseOptions?: import('@apollo/client').MutationOptions<AdmitPatientMutation, AdmitPatientMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<AdmitPatientMutation, AdmitPatientMutationVariables>(AdmitPatientDocument, options);
      }
export type AdmitPatientMutationHookResult = ReturnType<typeof useAdmitPatientMutation>;
export type AdmitPatientMutationResult = Apollo.MutationResult<AdmitPatientMutation>;
export type AdmitPatientMutationOptions = Apollo.BaseMutationOptions<AdmitPatientMutation, AdmitPatientMutationVariables>;
export const DischargePatientDocument = gql`
    mutation DischargePatient($id: ID!) {
  dischargePatient(id: $id) {
    id
    state
  }
}
    `;
export type DischargePatientMutationFn = Apollo.MutationFunction<DischargePatientMutation, DischargePatientMutationVariables>;

/**
 * __useDischargePatientMutation__
 *
 * To run a mutation, you first call `useDischargePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDischargePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [dischargePatientMutation, { data, loading, error }] = useDischargePatientMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDischargePatientMutation(baseOptions?: import('@apollo/client').MutationOptions<DischargePatientMutation, DischargePatientMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<DischargePatientMutation, DischargePatientMutationVariables>(DischargePatientDocument, options);
      }
export type DischargePatientMutationHookResult = ReturnType<typeof useDischargePatientMutation>;
export type DischargePatientMutationResult = Apollo.MutationResult<DischargePatientMutation>;
export type DischargePatientMutationOptions = Apollo.BaseMutationOptions<DischargePatientMutation, DischargePatientMutationVariables>;
export const MarkPatientDeadDocument = gql`
    mutation MarkPatientDead($id: ID!) {
  markPatientDead(id: $id) {
    id
    state
  }
}
    `;
export type MarkPatientDeadMutationFn = Apollo.MutationFunction<MarkPatientDeadMutation, MarkPatientDeadMutationVariables>;

/**
 * __useMarkPatientDeadMutation__
 *
 * To run a mutation, you first call `useMarkPatientDeadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkPatientDeadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markPatientDeadMutation, { data, loading, error }] = useMarkPatientDeadMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useMarkPatientDeadMutation(baseOptions?: import('@apollo/client').MutationOptions<MarkPatientDeadMutation, MarkPatientDeadMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<MarkPatientDeadMutation, MarkPatientDeadMutationVariables>(MarkPatientDeadDocument, options);
      }
export type MarkPatientDeadMutationHookResult = ReturnType<typeof useMarkPatientDeadMutation>;
export type MarkPatientDeadMutationResult = Apollo.MutationResult<MarkPatientDeadMutation>;
export type MarkPatientDeadMutationOptions = Apollo.BaseMutationOptions<MarkPatientDeadMutation, MarkPatientDeadMutationVariables>;
export const WaitPatientDocument = gql`
    mutation WaitPatient($id: ID!) {
  waitPatient(id: $id) {
    id
    state
  }
}
    `;
export type WaitPatientMutationFn = Apollo.MutationFunction<WaitPatientMutation, WaitPatientMutationVariables>;

/**
 * __useWaitPatientMutation__
 *
 * To run a mutation, you first call `useWaitPatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useWaitPatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [waitPatientMutation, { data, loading, error }] = useWaitPatientMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useWaitPatientMutation(baseOptions?: import('@apollo/client').MutationOptions<WaitPatientMutation, WaitPatientMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<WaitPatientMutation, WaitPatientMutationVariables>(WaitPatientDocument, options);
      }
export type WaitPatientMutationHookResult = ReturnType<typeof useWaitPatientMutation>;
export type WaitPatientMutationResult = Apollo.MutationResult<WaitPatientMutation>;
export type WaitPatientMutationOptions = Apollo.BaseMutationOptions<WaitPatientMutation, WaitPatientMutationVariables>;
export const DeletePatientDocument = gql`
    mutation DeletePatient($id: ID!) {
  deletePatient(id: $id)
}
    `;
export type DeletePatientMutationFn = Apollo.MutationFunction<DeletePatientMutation, DeletePatientMutationVariables>;

/**
 * __useDeletePatientMutation__
 *
 * To run a mutation, you first call `useDeletePatientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePatientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePatientMutation, { data, loading, error }] = useDeletePatientMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePatientMutation(baseOptions?: import('@apollo/client').MutationOptions<DeletePatientMutation, DeletePatientMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<DeletePatientMutation, DeletePatientMutationVariables>(DeletePatientDocument, options);
      }
export type DeletePatientMutationHookResult = ReturnType<typeof useDeletePatientMutation>;
export type DeletePatientMutationResult = Apollo.MutationResult<DeletePatientMutation>;
export type DeletePatientMutationOptions = Apollo.BaseMutationOptions<DeletePatientMutation, DeletePatientMutationVariables>;
export const CreatePropertyDefinitionDocument = gql`
    mutation CreatePropertyDefinition($data: CreatePropertyDefinitionInput!) {
  createPropertyDefinition(data: $data) {
    id
    name
    description
    fieldType
    isActive
    allowedEntities
    options
  }
}
    `;
export type CreatePropertyDefinitionMutationFn = Apollo.MutationFunction<CreatePropertyDefinitionMutation, CreatePropertyDefinitionMutationVariables>;

/**
 * __useCreatePropertyDefinitionMutation__
 *
 * To run a mutation, you first call `useCreatePropertyDefinitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePropertyDefinitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPropertyDefinitionMutation, { data, loading, error }] = useCreatePropertyDefinitionMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreatePropertyDefinitionMutation(baseOptions?: import('@apollo/client').MutationOptions<CreatePropertyDefinitionMutation, CreatePropertyDefinitionMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<CreatePropertyDefinitionMutation, CreatePropertyDefinitionMutationVariables>(CreatePropertyDefinitionDocument, options);
      }
export type CreatePropertyDefinitionMutationHookResult = ReturnType<typeof useCreatePropertyDefinitionMutation>;
export type CreatePropertyDefinitionMutationResult = Apollo.MutationResult<CreatePropertyDefinitionMutation>;
export type CreatePropertyDefinitionMutationOptions = Apollo.BaseMutationOptions<CreatePropertyDefinitionMutation, CreatePropertyDefinitionMutationVariables>;
export const UpdatePropertyDefinitionDocument = gql`
    mutation UpdatePropertyDefinition($id: ID!, $data: UpdatePropertyDefinitionInput!) {
  updatePropertyDefinition(id: $id, data: $data) {
    id
    name
    description
    fieldType
    isActive
    allowedEntities
    options
  }
}
    `;
export type UpdatePropertyDefinitionMutationFn = Apollo.MutationFunction<UpdatePropertyDefinitionMutation, UpdatePropertyDefinitionMutationVariables>;

/**
 * __useUpdatePropertyDefinitionMutation__
 *
 * To run a mutation, you first call `useUpdatePropertyDefinitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePropertyDefinitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePropertyDefinitionMutation, { data, loading, error }] = useUpdatePropertyDefinitionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdatePropertyDefinitionMutation(baseOptions?: import('@apollo/client').MutationOptions<UpdatePropertyDefinitionMutation, UpdatePropertyDefinitionMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<UpdatePropertyDefinitionMutation, UpdatePropertyDefinitionMutationVariables>(UpdatePropertyDefinitionDocument, options);
      }
export type UpdatePropertyDefinitionMutationHookResult = ReturnType<typeof useUpdatePropertyDefinitionMutation>;
export type UpdatePropertyDefinitionMutationResult = Apollo.MutationResult<UpdatePropertyDefinitionMutation>;
export type UpdatePropertyDefinitionMutationOptions = Apollo.BaseMutationOptions<UpdatePropertyDefinitionMutation, UpdatePropertyDefinitionMutationVariables>;
export const DeletePropertyDefinitionDocument = gql`
    mutation DeletePropertyDefinition($id: ID!) {
  deletePropertyDefinition(id: $id)
}
    `;
export type DeletePropertyDefinitionMutationFn = Apollo.MutationFunction<DeletePropertyDefinitionMutation, DeletePropertyDefinitionMutationVariables>;

/**
 * __useDeletePropertyDefinitionMutation__
 *
 * To run a mutation, you first call `useDeletePropertyDefinitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePropertyDefinitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePropertyDefinitionMutation, { data, loading, error }] = useDeletePropertyDefinitionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePropertyDefinitionMutation(baseOptions?: import('@apollo/client').MutationOptions<DeletePropertyDefinitionMutation, DeletePropertyDefinitionMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<DeletePropertyDefinitionMutation, DeletePropertyDefinitionMutationVariables>(DeletePropertyDefinitionDocument, options);
      }
export type DeletePropertyDefinitionMutationHookResult = ReturnType<typeof useDeletePropertyDefinitionMutation>;
export type DeletePropertyDefinitionMutationResult = Apollo.MutationResult<DeletePropertyDefinitionMutation>;
export type DeletePropertyDefinitionMutationOptions = Apollo.BaseMutationOptions<DeletePropertyDefinitionMutation, DeletePropertyDefinitionMutationVariables>;
export const GetPropertyDefinitionsDocument = gql`
    query GetPropertyDefinitions {
  propertyDefinitions {
    id
    name
    description
    fieldType
    isActive
    allowedEntities
    options
  }
}
    `;

/**
 * __useGetPropertyDefinitionsQuery__
 *
 * To run a query within a React component, call `useGetPropertyDefinitionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPropertyDefinitionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPropertyDefinitionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPropertyDefinitionsQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>>[1]) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>(GetPropertyDefinitionsDocument, options);
      }
export function useGetPropertyDefinitionsLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>(GetPropertyDefinitionsDocument, options);
        }
// @ts-ignore
export function useGetPropertyDefinitionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>;
export function useGetPropertyDefinitionsSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPropertyDefinitionsQuery | undefined, GetPropertyDefinitionsQueryVariables>;
export function useGetPropertyDefinitionsSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>(GetPropertyDefinitionsDocument, options);
        }
export type GetPropertyDefinitionsQueryHookResult = ReturnType<typeof useGetPropertyDefinitionsQuery>;
export type GetPropertyDefinitionsLazyQueryHookResult = ReturnType<typeof useGetPropertyDefinitionsLazyQuery>;
export type GetPropertyDefinitionsSuspenseQueryHookResult = ReturnType<typeof useGetPropertyDefinitionsSuspenseQuery>;
export type GetPropertyDefinitionsQueryResult = anyGetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>;
export const GetPropertiesForSubjectDocument = gql`
    query GetPropertiesForSubject($subjectId: ID!, $subjectType: PropertyEntity!) {
  propertyDefinitions {
    id
    name
    description
    fieldType
    isActive
    allowedEntities
    options
  }
}
    `;

/**
 * __useGetPropertiesForSubjectQuery__
 *
 * To run a query within a React component, call `useGetPropertiesForSubjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPropertiesForSubjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPropertiesForSubjectQuery({
 *   variables: {
 *      subjectId: // value for 'subjectId'
 *      subjectType: // value for 'subjectType'
 *   },
 * });
 */
export function useGetPropertiesForSubjectQuery(baseOptions: Parameters<typeof import('@apollo/client/react').useQuery<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>>[1] & ({ variables: GetPropertiesForSubjectQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useQuery<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>(GetPropertiesForSubjectDocument, options);
      }
export function useGetPropertiesForSubjectLazyQuery(baseOptions?: Parameters<typeof import('@apollo/client/react').useQuery<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>>[1]) {
          const options = {...defaultOptions, ...(baseOptions as any)}
          return useLazyQuery<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>(GetPropertiesForSubjectDocument, options);
        }
// @ts-ignore
export function useGetPropertiesForSubjectSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>): Apollo.UseSuspenseQueryResult<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>;
export function useGetPropertiesForSubjectSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>): Apollo.UseSuspenseQueryResult<GetPropertiesForSubjectQuery | undefined, GetPropertiesForSubjectQueryVariables>;
export function useGetPropertiesForSubjectSuspenseQuery(baseOptions?: typeof skipToken | Apollo.SuspenseQueryHookOptions<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>) {
          const options = baseOptions === skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>(GetPropertiesForSubjectDocument, options);
        }
export type GetPropertiesForSubjectQueryHookResult = ReturnType<typeof useGetPropertiesForSubjectQuery>;
export type GetPropertiesForSubjectLazyQueryHookResult = ReturnType<typeof useGetPropertiesForSubjectLazyQuery>;
export type GetPropertiesForSubjectSuspenseQueryHookResult = ReturnType<typeof useGetPropertiesForSubjectSuspenseQuery>;
export type GetPropertiesForSubjectQueryResult = anyGetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>;
export const PatientCreatedDocument = gql`
    subscription PatientCreated($rootLocationIds: [ID!]) {
  patientCreated(rootLocationIds: $rootLocationIds)
}
    `;

/**
 * __usePatientCreatedSubscription__
 *
 * To run a query within a React component, call `usePatientCreatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `usePatientCreatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePatientCreatedSubscription({
 *   variables: {
 *      rootLocationIds: // value for 'rootLocationIds'
 *   },
 * });
 */
export function usePatientCreatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<PatientCreatedSubscription, PatientCreatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<PatientCreatedSubscription, PatientCreatedSubscriptionVariables>(PatientCreatedDocument, options);
      }
export type PatientCreatedSubscriptionHookResult = ReturnType<typeof usePatientCreatedSubscription>;
export type PatientCreatedSubscriptionResult = Apollo.SubscriptionResult<PatientCreatedSubscription>;
export const PatientUpdatedDocument = gql`
    subscription PatientUpdated($patientId: ID, $rootLocationIds: [ID!]) {
  patientUpdated(patientId: $patientId, rootLocationIds: $rootLocationIds)
}
    `;

/**
 * __usePatientUpdatedSubscription__
 *
 * To run a query within a React component, call `usePatientUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `usePatientUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePatientUpdatedSubscription({
 *   variables: {
 *      patientId: // value for 'patientId'
 *      rootLocationIds: // value for 'rootLocationIds'
 *   },
 * });
 */
export function usePatientUpdatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<PatientUpdatedSubscription, PatientUpdatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<PatientUpdatedSubscription, PatientUpdatedSubscriptionVariables>(PatientUpdatedDocument, options);
      }
export type PatientUpdatedSubscriptionHookResult = ReturnType<typeof usePatientUpdatedSubscription>;
export type PatientUpdatedSubscriptionResult = Apollo.SubscriptionResult<PatientUpdatedSubscription>;
export const PatientStateChangedDocument = gql`
    subscription PatientStateChanged($patientId: ID, $rootLocationIds: [ID!]) {
  patientStateChanged(patientId: $patientId, rootLocationIds: $rootLocationIds)
}
    `;

/**
 * __usePatientStateChangedSubscription__
 *
 * To run a query within a React component, call `usePatientStateChangedSubscription` and pass it any options that fit your needs.
 * When your component renders, `usePatientStateChangedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePatientStateChangedSubscription({
 *   variables: {
 *      patientId: // value for 'patientId'
 *      rootLocationIds: // value for 'rootLocationIds'
 *   },
 * });
 */
export function usePatientStateChangedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<PatientStateChangedSubscription, PatientStateChangedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<PatientStateChangedSubscription, PatientStateChangedSubscriptionVariables>(PatientStateChangedDocument, options);
      }
export type PatientStateChangedSubscriptionHookResult = ReturnType<typeof usePatientStateChangedSubscription>;
export type PatientStateChangedSubscriptionResult = Apollo.SubscriptionResult<PatientStateChangedSubscription>;
export const TaskCreatedDocument = gql`
    subscription TaskCreated($rootLocationIds: [ID!]) {
  taskCreated(rootLocationIds: $rootLocationIds)
}
    `;

/**
 * __useTaskCreatedSubscription__
 *
 * To run a query within a React component, call `useTaskCreatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useTaskCreatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTaskCreatedSubscription({
 *   variables: {
 *      rootLocationIds: // value for 'rootLocationIds'
 *   },
 * });
 */
export function useTaskCreatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<TaskCreatedSubscription, TaskCreatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<TaskCreatedSubscription, TaskCreatedSubscriptionVariables>(TaskCreatedDocument, options);
      }
export type TaskCreatedSubscriptionHookResult = ReturnType<typeof useTaskCreatedSubscription>;
export type TaskCreatedSubscriptionResult = Apollo.SubscriptionResult<TaskCreatedSubscription>;
export const TaskUpdatedDocument = gql`
    subscription TaskUpdated($taskId: ID, $rootLocationIds: [ID!]) {
  taskUpdated(taskId: $taskId, rootLocationIds: $rootLocationIds)
}
    `;

/**
 * __useTaskUpdatedSubscription__
 *
 * To run a query within a React component, call `useTaskUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useTaskUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTaskUpdatedSubscription({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      rootLocationIds: // value for 'rootLocationIds'
 *   },
 * });
 */
export function useTaskUpdatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<TaskUpdatedSubscription, TaskUpdatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<TaskUpdatedSubscription, TaskUpdatedSubscriptionVariables>(TaskUpdatedDocument, options);
      }
export type TaskUpdatedSubscriptionHookResult = ReturnType<typeof useTaskUpdatedSubscription>;
export type TaskUpdatedSubscriptionResult = Apollo.SubscriptionResult<TaskUpdatedSubscription>;
export const TaskDeletedDocument = gql`
    subscription TaskDeleted($rootLocationIds: [ID!]) {
  taskDeleted(rootLocationIds: $rootLocationIds)
}
    `;

/**
 * __useTaskDeletedSubscription__
 *
 * To run a query within a React component, call `useTaskDeletedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useTaskDeletedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTaskDeletedSubscription({
 *   variables: {
 *      rootLocationIds: // value for 'rootLocationIds'
 *   },
 * });
 */
export function useTaskDeletedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<TaskDeletedSubscription, TaskDeletedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<TaskDeletedSubscription, TaskDeletedSubscriptionVariables>(TaskDeletedDocument, options);
      }
export type TaskDeletedSubscriptionHookResult = ReturnType<typeof useTaskDeletedSubscription>;
export type TaskDeletedSubscriptionResult = Apollo.SubscriptionResult<TaskDeletedSubscription>;
export const LocationNodeUpdatedDocument = gql`
    subscription LocationNodeUpdated($locationId: ID) {
  locationNodeUpdated(locationId: $locationId)
}
    `;

/**
 * __useLocationNodeUpdatedSubscription__
 *
 * To run a query within a React component, call `useLocationNodeUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useLocationNodeUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationNodeUpdatedSubscription({
 *   variables: {
 *      locationId: // value for 'locationId'
 *   },
 * });
 */
export function useLocationNodeUpdatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<LocationNodeUpdatedSubscription, LocationNodeUpdatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<LocationNodeUpdatedSubscription, LocationNodeUpdatedSubscriptionVariables>(LocationNodeUpdatedDocument, options);
      }
export type LocationNodeUpdatedSubscriptionHookResult = ReturnType<typeof useLocationNodeUpdatedSubscription>;
export type LocationNodeUpdatedSubscriptionResult = Apollo.SubscriptionResult<LocationNodeUpdatedSubscription>;
export const LocationNodeCreatedDocument = gql`
    subscription LocationNodeCreated {
  locationNodeCreated
}
    `;

/**
 * __useLocationNodeCreatedSubscription__
 *
 * To run a query within a React component, call `useLocationNodeCreatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useLocationNodeCreatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationNodeCreatedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useLocationNodeCreatedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<LocationNodeCreatedSubscription, LocationNodeCreatedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<LocationNodeCreatedSubscription, LocationNodeCreatedSubscriptionVariables>(LocationNodeCreatedDocument, options);
      }
export type LocationNodeCreatedSubscriptionHookResult = ReturnType<typeof useLocationNodeCreatedSubscription>;
export type LocationNodeCreatedSubscriptionResult = Apollo.SubscriptionResult<LocationNodeCreatedSubscription>;
export const LocationNodeDeletedDocument = gql`
    subscription LocationNodeDeleted {
  locationNodeDeleted
}
    `;

/**
 * __useLocationNodeDeletedSubscription__
 *
 * To run a query within a React component, call `useLocationNodeDeletedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useLocationNodeDeletedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLocationNodeDeletedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useLocationNodeDeletedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<LocationNodeDeletedSubscription, LocationNodeDeletedSubscriptionVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return Apollo.useSubscription<LocationNodeDeletedSubscription, LocationNodeDeletedSubscriptionVariables>(LocationNodeDeletedDocument, options);
      }
export type LocationNodeDeletedSubscriptionHookResult = ReturnType<typeof useLocationNodeDeletedSubscription>;
export type LocationNodeDeletedSubscriptionResult = Apollo.SubscriptionResult<LocationNodeDeletedSubscription>;
export const CreateTaskDocument = gql`
    mutation CreateTask($data: CreateTaskInput!) {
  createTask(data: $data) {
    id
    title
    description
    done
    dueDate
    updateDate
    assignee {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
    patient {
      id
      name
    }
  }
}
    `;
export type CreateTaskMutationFn = Apollo.MutationFunction<CreateTaskMutation, CreateTaskMutationVariables>;

/**
 * __useCreateTaskMutation__
 *
 * To run a mutation, you first call `useCreateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTaskMutation, { data, loading, error }] = useCreateTaskMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateTaskMutation(baseOptions?: import('@apollo/client').MutationOptions<CreateTaskMutation, CreateTaskMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<CreateTaskMutation, CreateTaskMutationVariables>(CreateTaskDocument, options);
      }
export type CreateTaskMutationHookResult = ReturnType<typeof useCreateTaskMutation>;
export type CreateTaskMutationResult = Apollo.MutationResult<CreateTaskMutation>;
export type CreateTaskMutationOptions = Apollo.BaseMutationOptions<CreateTaskMutation, CreateTaskMutationVariables>;
export const UpdateTaskDocument = gql`
    mutation UpdateTask($id: ID!, $data: UpdateTaskInput!) {
  updateTask(id: $id, data: $data) {
    id
    title
    description
    done
    dueDate
    priority
    estimatedTime
    updateDate
    checksum
    patient {
      id
      name
    }
    assignee {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
    properties {
      definition {
        id
        name
        description
        fieldType
        isActive
        allowedEntities
        options
      }
      textValue
      numberValue
      booleanValue
      dateValue
      dateTimeValue
      selectValue
      multiSelectValues
    }
  }
}
    `;
export type UpdateTaskMutationFn = Apollo.MutationFunction<UpdateTaskMutation, UpdateTaskMutationVariables>;

/**
 * __useUpdateTaskMutation__
 *
 * To run a mutation, you first call `useUpdateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskMutation, { data, loading, error }] = useUpdateTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateTaskMutation(baseOptions?: import('@apollo/client').MutationOptions<UpdateTaskMutation, UpdateTaskMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, options);
      }
export type UpdateTaskMutationHookResult = ReturnType<typeof useUpdateTaskMutation>;
export type UpdateTaskMutationResult = Apollo.MutationResult<UpdateTaskMutation>;
export type UpdateTaskMutationOptions = Apollo.BaseMutationOptions<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const AssignTaskDocument = gql`
    mutation AssignTask($id: ID!, $userId: ID!) {
  assignTask(id: $id, userId: $userId) {
    id
    assignee {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
  }
}
    `;
export type AssignTaskMutationFn = Apollo.MutationFunction<AssignTaskMutation, AssignTaskMutationVariables>;

/**
 * __useAssignTaskMutation__
 *
 * To run a mutation, you first call `useAssignTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignTaskMutation, { data, loading, error }] = useAssignTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useAssignTaskMutation(baseOptions?: import('@apollo/client').MutationOptions<AssignTaskMutation, AssignTaskMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<AssignTaskMutation, AssignTaskMutationVariables>(AssignTaskDocument, options);
      }
export type AssignTaskMutationHookResult = ReturnType<typeof useAssignTaskMutation>;
export type AssignTaskMutationResult = Apollo.MutationResult<AssignTaskMutation>;
export type AssignTaskMutationOptions = Apollo.BaseMutationOptions<AssignTaskMutation, AssignTaskMutationVariables>;
export const UnassignTaskDocument = gql`
    mutation UnassignTask($id: ID!) {
  unassignTask(id: $id) {
    id
    assignee {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
  }
}
    `;
export type UnassignTaskMutationFn = Apollo.MutationFunction<UnassignTaskMutation, UnassignTaskMutationVariables>;

/**
 * __useUnassignTaskMutation__
 *
 * To run a mutation, you first call `useUnassignTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnassignTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unassignTaskMutation, { data, loading, error }] = useUnassignTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnassignTaskMutation(baseOptions?: import('@apollo/client').MutationOptions<UnassignTaskMutation, UnassignTaskMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<UnassignTaskMutation, UnassignTaskMutationVariables>(UnassignTaskDocument, options);
      }
export type UnassignTaskMutationHookResult = ReturnType<typeof useUnassignTaskMutation>;
export type UnassignTaskMutationResult = Apollo.MutationResult<UnassignTaskMutation>;
export type UnassignTaskMutationOptions = Apollo.BaseMutationOptions<UnassignTaskMutation, UnassignTaskMutationVariables>;
export const DeleteTaskDocument = gql`
    mutation DeleteTask($id: ID!) {
  deleteTask(id: $id)
}
    `;
export type DeleteTaskMutationFn = Apollo.MutationFunction<DeleteTaskMutation, DeleteTaskMutationVariables>;

/**
 * __useDeleteTaskMutation__
 *
 * To run a mutation, you first call `useDeleteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTaskMutation, { data, loading, error }] = useDeleteTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTaskMutation(baseOptions?: import('@apollo/client').MutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, options);
      }
export type DeleteTaskMutationHookResult = ReturnType<typeof useDeleteTaskMutation>;
export type DeleteTaskMutationResult = Apollo.MutationResult<DeleteTaskMutation>;
export type DeleteTaskMutationOptions = Apollo.BaseMutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const CompleteTaskDocument = gql`
    mutation CompleteTask($id: ID!) {
  completeTask(id: $id) {
    id
    done
    updateDate
  }
}
    `;
export type CompleteTaskMutationFn = Apollo.MutationFunction<CompleteTaskMutation, CompleteTaskMutationVariables>;

/**
 * __useCompleteTaskMutation__
 *
 * To run a mutation, you first call `useCompleteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeTaskMutation, { data, loading, error }] = useCompleteTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCompleteTaskMutation(baseOptions?: import('@apollo/client').MutationOptions<CompleteTaskMutation, CompleteTaskMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<CompleteTaskMutation, CompleteTaskMutationVariables>(CompleteTaskDocument, options);
      }
export type CompleteTaskMutationHookResult = ReturnType<typeof useCompleteTaskMutation>;
export type CompleteTaskMutationResult = Apollo.MutationResult<CompleteTaskMutation>;
export type CompleteTaskMutationOptions = Apollo.BaseMutationOptions<CompleteTaskMutation, CompleteTaskMutationVariables>;
export const ReopenTaskDocument = gql`
    mutation ReopenTask($id: ID!) {
  reopenTask(id: $id) {
    id
    done
    updateDate
  }
}
    `;
export type ReopenTaskMutationFn = Apollo.MutationFunction<ReopenTaskMutation, ReopenTaskMutationVariables>;

/**
 * __useReopenTaskMutation__
 *
 * To run a mutation, you first call `useReopenTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReopenTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reopenTaskMutation, { data, loading, error }] = useReopenTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReopenTaskMutation(baseOptions?: import('@apollo/client').MutationOptions<ReopenTaskMutation, ReopenTaskMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<ReopenTaskMutation, ReopenTaskMutationVariables>(ReopenTaskDocument, options);
      }
export type ReopenTaskMutationHookResult = ReturnType<typeof useReopenTaskMutation>;
export type ReopenTaskMutationResult = Apollo.MutationResult<ReopenTaskMutation>;
export type ReopenTaskMutationOptions = Apollo.BaseMutationOptions<ReopenTaskMutation, ReopenTaskMutationVariables>;
export const AssignTaskToTeamDocument = gql`
    mutation AssignTaskToTeam($id: ID!, $teamId: ID!) {
  assignTaskToTeam(id: $id, teamId: $teamId) {
    id
    assigneeTeam {
      id
      title
      kind
    }
  }
}
    `;
export type AssignTaskToTeamMutationFn = Apollo.MutationFunction<AssignTaskToTeamMutation, AssignTaskToTeamMutationVariables>;

/**
 * __useAssignTaskToTeamMutation__
 *
 * To run a mutation, you first call `useAssignTaskToTeamMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignTaskToTeamMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignTaskToTeamMutation, { data, loading, error }] = useAssignTaskToTeamMutation({
 *   variables: {
 *      id: // value for 'id'
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useAssignTaskToTeamMutation(baseOptions?: import('@apollo/client').MutationOptions<AssignTaskToTeamMutation, AssignTaskToTeamMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<AssignTaskToTeamMutation, AssignTaskToTeamMutationVariables>(AssignTaskToTeamDocument, options);
      }
export type AssignTaskToTeamMutationHookResult = ReturnType<typeof useAssignTaskToTeamMutation>;
export type AssignTaskToTeamMutationResult = Apollo.MutationResult<AssignTaskToTeamMutation>;
export type AssignTaskToTeamMutationOptions = Apollo.BaseMutationOptions<AssignTaskToTeamMutation, AssignTaskToTeamMutationVariables>;
export const UnassignTaskFromTeamDocument = gql`
    mutation UnassignTaskFromTeam($id: ID!) {
  unassignTaskFromTeam(id: $id) {
    id
    assigneeTeam {
      id
      title
      kind
    }
  }
}
    `;
export type UnassignTaskFromTeamMutationFn = Apollo.MutationFunction<UnassignTaskFromTeamMutation, UnassignTaskFromTeamMutationVariables>;

/**
 * __useUnassignTaskFromTeamMutation__
 *
 * To run a mutation, you first call `useUnassignTaskFromTeamMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnassignTaskFromTeamMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unassignTaskFromTeamMutation, { data, loading, error }] = useUnassignTaskFromTeamMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnassignTaskFromTeamMutation(baseOptions?: import('@apollo/client').MutationOptions<UnassignTaskFromTeamMutation, UnassignTaskFromTeamMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<UnassignTaskFromTeamMutation, UnassignTaskFromTeamMutationVariables>(UnassignTaskFromTeamDocument, options);
      }
export type UnassignTaskFromTeamMutationHookResult = ReturnType<typeof useUnassignTaskFromTeamMutation>;
export type UnassignTaskFromTeamMutationResult = Apollo.MutationResult<UnassignTaskFromTeamMutation>;
export type UnassignTaskFromTeamMutationOptions = Apollo.BaseMutationOptions<UnassignTaskFromTeamMutation, UnassignTaskFromTeamMutationVariables>;
export const UpdateProfilePictureDocument = gql`
    mutation UpdateProfilePicture($data: UpdateProfilePictureInput!) {
  updateProfilePicture(data: $data) {
    id
    username
    name
    email
    firstname
    lastname
    title
    avatarUrl
    lastOnline
    isOnline
  }
}
    `;
export type UpdateProfilePictureMutationFn = Apollo.MutationFunction<UpdateProfilePictureMutation, UpdateProfilePictureMutationVariables>;

/**
 * __useUpdateProfilePictureMutation__
 *
 * To run a mutation, you first call `useUpdateProfilePictureMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfilePictureMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfilePictureMutation, { data, loading, error }] = useUpdateProfilePictureMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateProfilePictureMutation(baseOptions?: import('@apollo/client').MutationOptions<UpdateProfilePictureMutation, UpdateProfilePictureMutationVariables>) {
        const options = {...defaultOptions, ...(baseOptions as any)}
        return useMutation<UpdateProfilePictureMutation, UpdateProfilePictureMutationVariables>(UpdateProfilePictureDocument, options);
      }
export type UpdateProfilePictureMutationHookResult = ReturnType<typeof useUpdateProfilePictureMutation>;
export type UpdateProfilePictureMutationResult = Apollo.MutationResult<UpdateProfilePictureMutation>;
export type UpdateProfilePictureMutationOptions = Apollo.BaseMutationOptions<UpdateProfilePictureMutation, UpdateProfilePictureMutationVariables>;