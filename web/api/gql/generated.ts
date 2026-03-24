import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date (isoformat) */
  Date: { input: any; output: any; }
  /** Date with time (isoformat) */
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

export type CreateSavedViewInput = {
  baseEntityType: SavedViewEntityType;
  filterDefinition: Scalars['String']['input'];
  name: Scalars['String']['input'];
  parameters: Scalars['String']['input'];
  sortDefinition: Scalars['String']['input'];
  visibility?: SavedViewVisibility;
};

export type CreateTaskInput = {
  assigneeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  estimatedTime?: InputMaybe<Scalars['Int']['input']>;
  patientId?: InputMaybe<Scalars['ID']['input']>;
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
  FieldTypeUnspecified = 'FIELD_TYPE_UNSPECIFIED',
  FieldTypeUser = 'FIELD_TYPE_USER'
}

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
  addTaskAssignee: TaskType;
  admitPatient: PatientType;
  assignTaskToTeam: TaskType;
  completeTask: TaskType;
  createLocationNode: LocationNodeType;
  createPatient: PatientType;
  createPropertyDefinition: PropertyDefinitionType;
  createSavedView: SavedView;
  createTask: TaskType;
  deleteLocationNode: Scalars['Boolean']['output'];
  deletePatient: Scalars['Boolean']['output'];
  deletePropertyDefinition: Scalars['Boolean']['output'];
  deleteSavedView: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  dischargePatient: PatientType;
  duplicateSavedView: SavedView;
  markPatientDead: PatientType;
  removeTaskAssignee: TaskType;
  reopenTask: TaskType;
  unassignTaskFromTeam: TaskType;
  updateLocationNode: LocationNodeType;
  updatePatient: PatientType;
  updateProfilePicture: UserType;
  updatePropertyDefinition: PropertyDefinitionType;
  updateSavedView: SavedView;
  updateTask: TaskType;
  waitPatient: PatientType;
};


export type MutationAddTaskAssigneeArgs = {
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAdmitPatientArgs = {
  id: Scalars['ID']['input'];
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


export type MutationCreateSavedViewArgs = {
  data: CreateSavedViewInput;
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


export type MutationDeleteSavedViewArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDischargePatientArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDuplicateSavedViewArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationMarkPatientDeadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveTaskAssigneeArgs = {
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationReopenTaskArgs = {
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


export type MutationUpdateSavedViewArgs = {
  data: UpdateSavedViewInput;
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
  userValue?: InputMaybe<Scalars['String']['input']>;
};

export type PropertyValueType = {
  __typename?: 'PropertyValueType';
  booleanValue?: Maybe<Scalars['Boolean']['output']>;
  dateTimeValue?: Maybe<Scalars['DateTime']['output']>;
  dateValue?: Maybe<Scalars['Date']['output']>;
  definition: PropertyDefinitionType;
  id: Scalars['ID']['output'];
  multiSelectValues?: Maybe<Array<Scalars['String']['output']>>;
  numberValue?: Maybe<Scalars['Float']['output']>;
  selectValue?: Maybe<Scalars['String']['output']>;
  team?: Maybe<LocationNodeType>;
  textValue?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserType>;
  userValue?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  auditLogs: Array<AuditLogType>;
  locationNode?: Maybe<LocationNodeType>;
  locationNodes: Array<LocationNodeType>;
  locationRoots: Array<LocationNodeType>;
  me?: Maybe<UserType>;
  mySavedViews: Array<SavedView>;
  patient?: Maybe<PatientType>;
  patients: Array<PatientType>;
  patientsTotal: Scalars['Int']['output'];
  propertyDefinitions: Array<PropertyDefinitionType>;
  queryableFields: Array<QueryableField>;
  recentPatients: Array<PatientType>;
  recentPatientsTotal: Scalars['Int']['output'];
  recentTasks: Array<TaskType>;
  recentTasksTotal: Scalars['Int']['output'];
  savedView?: Maybe<SavedView>;
  task?: Maybe<TaskType>;
  tasks: Array<TaskType>;
  tasksTotal: Scalars['Int']['output'];
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
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  locationNodeId?: InputMaybe<Scalars['ID']['input']>;
  pagination?: InputMaybe<PaginationInput>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
  states?: InputMaybe<Array<PatientState>>;
};


export type QueryPatientsTotalArgs = {
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  locationNodeId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
  states?: InputMaybe<Array<PatientState>>;
};


export type QueryQueryableFieldsArgs = {
  entity: Scalars['String']['input'];
};


export type QueryRecentPatientsArgs = {
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  pagination?: InputMaybe<PaginationInput>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
};


export type QueryRecentPatientsTotalArgs = {
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
};


export type QueryRecentTasksArgs = {
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  pagination?: InputMaybe<PaginationInput>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
};


export type QueryRecentTasksTotalArgs = {
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
};


export type QuerySavedViewArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  pagination?: InputMaybe<PaginationInput>;
  patientId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
};


export type QueryTasksTotalArgs = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  patientId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  filters?: InputMaybe<Array<QueryFilterClauseInput>>;
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<QuerySearchInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput>>;
};

export type QueryFilterClauseInput = {
  fieldKey: Scalars['String']['input'];
  operator: QueryOperator;
  value?: InputMaybe<QueryFilterValueInput>;
};

export type QueryFilterValueInput = {
  boolValue?: InputMaybe<Scalars['Boolean']['input']>;
  dateMax?: InputMaybe<Scalars['Date']['input']>;
  dateMin?: InputMaybe<Scalars['Date']['input']>;
  dateValue?: InputMaybe<Scalars['DateTime']['input']>;
  floatMax?: InputMaybe<Scalars['Float']['input']>;
  floatMin?: InputMaybe<Scalars['Float']['input']>;
  floatValue?: InputMaybe<Scalars['Float']['input']>;
  stringValue?: InputMaybe<Scalars['String']['input']>;
  stringValues?: InputMaybe<Array<Scalars['String']['input']>>;
  uuidValue?: InputMaybe<Scalars['String']['input']>;
  uuidValues?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum QueryOperator {
  AllIn = 'ALL_IN',
  AnyEq = 'ANY_EQ',
  AnyIn = 'ANY_IN',
  Between = 'BETWEEN',
  Contains = 'CONTAINS',
  EndsWith = 'ENDS_WITH',
  Eq = 'EQ',
  Gt = 'GT',
  Gte = 'GTE',
  In = 'IN',
  IsEmpty = 'IS_EMPTY',
  IsNotEmpty = 'IS_NOT_EMPTY',
  IsNotNull = 'IS_NOT_NULL',
  IsNull = 'IS_NULL',
  Lt = 'LT',
  Lte = 'LTE',
  Neq = 'NEQ',
  NoneIn = 'NONE_IN',
  NotIn = 'NOT_IN',
  StartsWith = 'STARTS_WITH'
}

export type QuerySearchInput = {
  includeProperties?: Scalars['Boolean']['input'];
  searchText?: InputMaybe<Scalars['String']['input']>;
};

export type QuerySortClauseInput = {
  direction: SortDirection;
  fieldKey: Scalars['String']['input'];
};

export type QueryableChoiceMeta = {
  __typename?: 'QueryableChoiceMeta';
  optionKeys: Array<Scalars['String']['output']>;
  optionLabels: Array<Scalars['String']['output']>;
};

export type QueryableField = {
  __typename?: 'QueryableField';
  allowedOperators: Array<QueryOperator>;
  choice?: Maybe<QueryableChoiceMeta>;
  filterable: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  kind: QueryableFieldKind;
  label: Scalars['String']['output'];
  propertyDefinitionId?: Maybe<Scalars['String']['output']>;
  relation?: Maybe<QueryableRelationMeta>;
  searchable: Scalars['Boolean']['output'];
  sortDirections: Array<SortDirection>;
  sortable: Scalars['Boolean']['output'];
  valueType: QueryableValueType;
};

export enum QueryableFieldKind {
  Choice = 'CHOICE',
  ChoiceList = 'CHOICE_LIST',
  Property = 'PROPERTY',
  Reference = 'REFERENCE',
  ReferenceList = 'REFERENCE_LIST',
  Scalar = 'SCALAR'
}

export type QueryableRelationMeta = {
  __typename?: 'QueryableRelationMeta';
  allowedFilterModes: Array<ReferenceFilterMode>;
  idFieldKey: Scalars['String']['output'];
  labelFieldKey: Scalars['String']['output'];
  targetEntity: Scalars['String']['output'];
};

export enum QueryableValueType {
  Boolean = 'BOOLEAN',
  Date = 'DATE',
  Datetime = 'DATETIME',
  Number = 'NUMBER',
  String = 'STRING',
  StringList = 'STRING_LIST',
  Uuid = 'UUID',
  UuidList = 'UUID_LIST'
}

export enum ReferenceFilterMode {
  Id = 'ID',
  Label = 'LABEL'
}

export type SavedView = {
  __typename?: 'SavedView';
  baseEntityType: SavedViewEntityType;
  createdAt: Scalars['String']['output'];
  filterDefinition: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isOwner: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  ownerUserId: Scalars['ID']['output'];
  parameters: Scalars['String']['output'];
  sortDefinition: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  visibility: SavedViewVisibility;
};

export enum SavedViewEntityType {
  Patient = 'PATIENT',
  Task = 'TASK'
}

export enum SavedViewVisibility {
  LinkShared = 'LINK_SHARED',
  Private = 'PRIVATE'
}

export enum Sex {
  Female = 'FEMALE',
  Male = 'MALE',
  Unknown = 'UNKNOWN'
}

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

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
  assigneeTeam?: Maybe<LocationNodeType>;
  assigneeTeamId?: Maybe<Scalars['ID']['output']>;
  assignees: Array<UserType>;
  checksum: Scalars['String']['output'];
  creationDate: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  done: Scalars['Boolean']['output'];
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  estimatedTime?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  patient?: Maybe<PatientType>;
  patientId?: Maybe<Scalars['ID']['output']>;
  priority?: Maybe<Scalars['String']['output']>;
  properties: Array<PropertyValueType>;
  title: Scalars['String']['output'];
  updateDate?: Maybe<Scalars['DateTime']['output']>;
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

export type UpdateSavedViewInput = {
  filterDefinition?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  parameters?: InputMaybe<Scalars['String']['input']>;
  sortDefinition?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<SavedViewVisibility>;
};

export type UpdateTaskInput = {
  assigneeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  checksum?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  estimatedTime?: InputMaybe<Scalars['Int']['input']>;
  patientId?: InputMaybe<Scalars['ID']['input']>;
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


export type GetMyTasksQuery = { __typename?: 'Query', me?: { __typename?: 'UserType', id: string, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, creationDate: any, updateDate?: any | null, patient?: { __typename?: 'PatientType', id: string, name: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null }> } | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }> }> } | null };

export type GetOverviewDataQueryVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  recentPatientsFilters?: InputMaybe<Array<QueryFilterClauseInput> | QueryFilterClauseInput>;
  recentPatientsSorts?: InputMaybe<Array<QuerySortClauseInput> | QuerySortClauseInput>;
  recentPatientsPagination?: InputMaybe<PaginationInput>;
  recentPatientsSearch?: InputMaybe<QuerySearchInput>;
  recentTasksFilters?: InputMaybe<Array<QueryFilterClauseInput> | QueryFilterClauseInput>;
  recentTasksSorts?: InputMaybe<Array<QuerySortClauseInput> | QuerySortClauseInput>;
  recentTasksPagination?: InputMaybe<PaginationInput>;
  recentTasksSearch?: InputMaybe<QuerySearchInput>;
}>;


export type GetOverviewDataQuery = { __typename?: 'Query', recentPatientsTotal: number, recentTasksTotal: number, recentPatients: Array<{ __typename?: 'PatientType', id: string, name: string, sex: Sex, birthdate: any, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, tasks: Array<{ __typename?: 'TaskType', updateDate?: any | null }>, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> }>, recentTasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, updateDate?: any | null, priority?: string | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }>, patient?: { __typename?: 'PatientType', id: string, name: string, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> }> };

export type GetPatientQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetPatientQuery = { __typename?: 'Query', patient?: { __typename?: 'PatientType', id: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, description?: string | null, checksum: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }>, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, updateDate?: any | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }>, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }>, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> } | null };

export type GetPatientsQueryVariables = Exact<{
  locationId?: InputMaybe<Scalars['ID']['input']>;
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  states?: InputMaybe<Array<PatientState> | PatientState>;
  filters?: InputMaybe<Array<QueryFilterClauseInput> | QueryFilterClauseInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput> | QuerySortClauseInput>;
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<QuerySearchInput>;
}>;


export type GetPatientsQuery = { __typename?: 'Query', patientsTotal: number, patients: Array<{ __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null } | null } | null } | null } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null } | null } | null }>, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, creationDate: any, updateDate?: any | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }>, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }>, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> }> };

export type GetTaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTaskQuery = { __typename?: 'Query', task?: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, checksum: string, updateDate?: any | null, patient?: { __typename?: 'PatientType', id: string, name: string } | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }>, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> } | null };

export type GetTasksQueryVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  assigneeTeamId?: InputMaybe<Scalars['ID']['input']>;
  filters?: InputMaybe<Array<QueryFilterClauseInput> | QueryFilterClauseInput>;
  sorts?: InputMaybe<Array<QuerySortClauseInput> | QuerySortClauseInput>;
  pagination?: InputMaybe<PaginationInput>;
  search?: InputMaybe<QuerySearchInput>;
}>;


export type GetTasksQuery = { __typename?: 'Query', tasksTotal: number, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, creationDate: any, updateDate?: any | null, patient?: { __typename?: 'PatientType', id: string, name: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parent?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null } | null } | null }> } | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }>, assigneeTeam?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> }> };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'UserType', id: string, username: string, name: string, email?: string | null, firstname?: string | null, lastname?: string | null, title?: string | null, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null };

export type GetUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }> };

export type GetGlobalDataQueryVariables = Exact<{
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type GetGlobalDataQuery = { __typename?: 'Query', me?: { __typename?: 'UserType', id: string, username: string, name: string, firstname?: string | null, lastname?: string | null, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean, organizations?: string | null, rootLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }>, tasks: Array<{ __typename?: 'TaskType', id: string, done: boolean }> } | null, wards: Array<{ __typename?: 'LocationNodeType', id: string, title: string, parentId?: string | null }>, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, parentId?: string | null }>, clinics: Array<{ __typename?: 'LocationNodeType', id: string, title: string, parentId?: string | null }>, patients: Array<{ __typename?: 'PatientType', id: string, state: PatientState, assignedLocation?: { __typename?: 'LocationNodeType', id: string } | null }>, waitingPatients: Array<{ __typename?: 'PatientType', id: string, state: PatientState }> };

export type CreatePatientMutationVariables = Exact<{
  data: CreatePatientInput;
}>;


export type CreatePatientMutation = { __typename?: 'Mutation', createPatient: { __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }> } };

export type UpdatePatientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdatePatientInput;
}>;


export type UpdatePatientMutation = { __typename?: 'Mutation', updatePatient: { __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, state: PatientState, description?: string | null, checksum: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null, assignedLocations: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, clinic: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }, position?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType }>, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> } };

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

export type QueryableFieldsQueryVariables = Exact<{
  entity: Scalars['String']['input'];
}>;


export type QueryableFieldsQuery = { __typename?: 'Query', queryableFields: Array<{ __typename?: 'QueryableField', key: string, label: string, kind: QueryableFieldKind, valueType: QueryableValueType, allowedOperators: Array<QueryOperator>, sortable: boolean, sortDirections: Array<SortDirection>, searchable: boolean, filterable: boolean, propertyDefinitionId?: string | null, relation?: { __typename?: 'QueryableRelationMeta', targetEntity: string, idFieldKey: string, labelFieldKey: string, allowedFilterModes: Array<ReferenceFilterMode> } | null, choice?: { __typename?: 'QueryableChoiceMeta', optionKeys: Array<string>, optionLabels: Array<string> } | null }> };

export type MySavedViewsQueryVariables = Exact<{ [key: string]: never; }>;


export type MySavedViewsQuery = { __typename?: 'Query', mySavedViews: Array<{ __typename?: 'SavedView', id: string, name: string, baseEntityType: SavedViewEntityType, filterDefinition: string, sortDefinition: string, parameters: string, ownerUserId: string, visibility: SavedViewVisibility, createdAt: string, updatedAt: string, isOwner: boolean }> };

export type SavedViewQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SavedViewQuery = { __typename?: 'Query', savedView?: { __typename?: 'SavedView', id: string, name: string, baseEntityType: SavedViewEntityType, filterDefinition: string, sortDefinition: string, parameters: string, ownerUserId: string, visibility: SavedViewVisibility, createdAt: string, updatedAt: string, isOwner: boolean } | null };

export type CreateSavedViewMutationVariables = Exact<{
  data: CreateSavedViewInput;
}>;


export type CreateSavedViewMutation = { __typename?: 'Mutation', createSavedView: { __typename?: 'SavedView', id: string, name: string, baseEntityType: SavedViewEntityType, filterDefinition: string, sortDefinition: string, parameters: string, ownerUserId: string, visibility: SavedViewVisibility, createdAt: string, updatedAt: string, isOwner: boolean } };

export type UpdateSavedViewMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdateSavedViewInput;
}>;


export type UpdateSavedViewMutation = { __typename?: 'Mutation', updateSavedView: { __typename?: 'SavedView', id: string, name: string, baseEntityType: SavedViewEntityType, filterDefinition: string, sortDefinition: string, parameters: string, ownerUserId: string, visibility: SavedViewVisibility, createdAt: string, updatedAt: string, isOwner: boolean } };

export type DeleteSavedViewMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSavedViewMutation = { __typename?: 'Mutation', deleteSavedView: boolean };

export type DuplicateSavedViewMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type DuplicateSavedViewMutation = { __typename?: 'Mutation', duplicateSavedView: { __typename?: 'SavedView', id: string, name: string, baseEntityType: SavedViewEntityType, filterDefinition: string, sortDefinition: string, parameters: string, ownerUserId: string, visibility: SavedViewVisibility, createdAt: string, updatedAt: string, isOwner: boolean } };

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


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, updateDate?: any | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }>, patient?: { __typename?: 'PatientType', id: string, name: string } | null } };

export type UpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, priority?: string | null, estimatedTime?: number | null, updateDate?: any | null, checksum: string, patient?: { __typename?: 'PatientType', id: string, name: string } | null, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }>, properties: Array<{ __typename?: 'PropertyValueType', id: string, textValue?: string | null, numberValue?: number | null, booleanValue?: boolean | null, dateValue?: any | null, dateTimeValue?: any | null, selectValue?: string | null, multiSelectValues?: Array<string> | null, userValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', id: string, name: string, description?: string | null, fieldType: FieldType, isActive: boolean, allowedEntities: Array<PropertyEntity>, options: Array<string> }, user?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean } | null, team?: { __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType } | null }> } };

export type AddTaskAssigneeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
}>;


export type AddTaskAssigneeMutation = { __typename?: 'Mutation', addTaskAssignee: { __typename?: 'TaskType', id: string, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }> } };

export type RemoveTaskAssigneeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
}>;


export type RemoveTaskAssigneeMutation = { __typename?: 'Mutation', removeTaskAssignee: { __typename?: 'TaskType', id: string, assignees: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null, lastOnline?: any | null, isOnline: boolean }> } };

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


export const GetAuditLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuditLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"caseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auditLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"caseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"caseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"caseId"}},{"kind":"Field","name":{"kind":"Name","value":"activity"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"context"}}]}}]}}]} as unknown as DocumentNode<GetAuditLogsQuery, GetAuditLogsQueryVariables>;
export const GetLocationNodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLocationNode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locationNode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetLocationNodeQuery, GetLocationNodeQueryVariables>;
export const GetLocationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLocations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locationNodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}}]}}]} as unknown as DocumentNode<GetLocationsQuery, GetLocationsQueryVariables>;
export const GetMyTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyTasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedTime"}},{"kind":"Field","name":{"kind":"Name","value":"creationDate"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetMyTasksQuery, GetMyTasksQueryVariables>;
export const GetOverviewDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOverviewData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsFilters"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueryFilterClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsSorts"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySortClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsPagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySearchInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksFilters"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueryFilterClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksSorts"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySortClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksPagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySearchInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentPatients"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsFilters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsSorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsPagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsSearch"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"birthdate"}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentPatientsTotal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsFilters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsSorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentPatientsSearch"}}}]},{"kind":"Field","name":{"kind":"Name","value":"recentTasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksFilters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksSorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksPagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksSearch"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentTasksTotal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksFilters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksSorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recentTasksSearch"}}}]}]}}]} as unknown as DocumentNode<GetOverviewDataQuery, GetOverviewDataQueryVariables>;
export const GetPatientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPatient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"patient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"birthdate"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"checksum"}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"clinic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedTime"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assigneeTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPatientQuery, GetPatientQueryVariables>;
export const GetPatientsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPatients"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"states"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PatientState"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueryFilterClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sorts"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySortClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySearchInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"patients"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"locationNodeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"states"},"value":{"kind":"Variable","name":{"kind":"Name","value":"states"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"birthdate"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"clinic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedTime"}},{"kind":"Field","name":{"kind":"Name","value":"creationDate"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assigneeTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"patientsTotal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"locationNodeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"states"},"value":{"kind":"Variable","name":{"kind":"Name","value":"states"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}]}}]} as unknown as DocumentNode<GetPatientsQuery, GetPatientsQueryVariables>;
export const GetTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedTime"}},{"kind":"Field","name":{"kind":"Name","value":"checksum"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assigneeTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetTaskQuery, GetTaskQueryVariables>;
export const GetTasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTasks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assigneeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assigneeTeamId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueryFilterClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sorts"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySortClauseInput"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"QuerySearchInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"assigneeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assigneeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"assigneeTeamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assigneeTeamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedTime"}},{"kind":"Field","name":{"kind":"Name","value":"creationDate"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assigneeTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"tasksTotal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"assigneeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assigneeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"assigneeTeamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assigneeTeamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sorts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sorts"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}]}}]} as unknown as DocumentNode<GetTasksQuery, GetTasksQueryVariables>;
export const GetUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}}]}}]} as unknown as DocumentNode<GetUserQuery, GetUserQueryVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const GetGlobalDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGlobalData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}},{"kind":"Field","name":{"kind":"Name","value":"organizations"}},{"kind":"Field","name":{"kind":"Name","value":"rootLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"done"}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"wards"},"name":{"kind":"Name","value":"locationNodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"kind"},"value":{"kind":"EnumValue","value":"WARD"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"teams"},"name":{"kind":"Name","value":"locationNodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"kind"},"value":{"kind":"EnumValue","value":"TEAM"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"clinics"},"name":{"kind":"Name","value":"locationNodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"kind"},"value":{"kind":"EnumValue","value":"CLINIC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patients"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"waitingPatients"},"name":{"kind":"Name","value":"patients"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"states"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"WAIT"}]}},{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]} as unknown as DocumentNode<GetGlobalDataQuery, GetGlobalDataQueryVariables>;
export const CreatePatientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePatient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePatientInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPatient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"birthdate"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"clinic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]} as unknown as DocumentNode<CreatePatientMutation, CreatePatientMutationVariables>;
export const UpdatePatientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePatient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePatientInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePatient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"birthdate"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"checksum"}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignedLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"clinic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdatePatientMutation, UpdatePatientMutationVariables>;
export const AdmitPatientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdmitPatient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"admitPatient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]} as unknown as DocumentNode<AdmitPatientMutation, AdmitPatientMutationVariables>;
export const DischargePatientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DischargePatient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dischargePatient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]} as unknown as DocumentNode<DischargePatientMutation, DischargePatientMutationVariables>;
export const MarkPatientDeadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkPatientDead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markPatientDead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]} as unknown as DocumentNode<MarkPatientDeadMutation, MarkPatientDeadMutationVariables>;
export const WaitPatientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WaitPatient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"waitPatient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}}]} as unknown as DocumentNode<WaitPatientMutation, WaitPatientMutationVariables>;
export const DeletePatientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePatient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePatient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePatientMutation, DeletePatientMutationVariables>;
export const CreatePropertyDefinitionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePropertyDefinition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePropertyDefinitionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPropertyDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}}]}}]} as unknown as DocumentNode<CreatePropertyDefinitionMutation, CreatePropertyDefinitionMutationVariables>;
export const UpdatePropertyDefinitionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePropertyDefinition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePropertyDefinitionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePropertyDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}}]}}]} as unknown as DocumentNode<UpdatePropertyDefinitionMutation, UpdatePropertyDefinitionMutationVariables>;
export const DeletePropertyDefinitionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePropertyDefinition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePropertyDefinition"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeletePropertyDefinitionMutation, DeletePropertyDefinitionMutationVariables>;
export const GetPropertyDefinitionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPropertyDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}}]}}]} as unknown as DocumentNode<GetPropertyDefinitionsQuery, GetPropertyDefinitionsQueryVariables>;
export const GetPropertiesForSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPropertiesForSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subjectType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PropertyEntity"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"propertyDefinitions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}}]}}]} as unknown as DocumentNode<GetPropertiesForSubjectQuery, GetPropertiesForSubjectQueryVariables>;
export const QueryableFieldsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryableFields"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"entity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryableFields"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"entity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"entity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"valueType"}},{"kind":"Field","name":{"kind":"Name","value":"allowedOperators"}},{"kind":"Field","name":{"kind":"Name","value":"sortable"}},{"kind":"Field","name":{"kind":"Name","value":"sortDirections"}},{"kind":"Field","name":{"kind":"Name","value":"searchable"}},{"kind":"Field","name":{"kind":"Name","value":"filterable"}},{"kind":"Field","name":{"kind":"Name","value":"propertyDefinitionId"}},{"kind":"Field","name":{"kind":"Name","value":"relation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targetEntity"}},{"kind":"Field","name":{"kind":"Name","value":"idFieldKey"}},{"kind":"Field","name":{"kind":"Name","value":"labelFieldKey"}},{"kind":"Field","name":{"kind":"Name","value":"allowedFilterModes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"choice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"optionKeys"}},{"kind":"Field","name":{"kind":"Name","value":"optionLabels"}}]}}]}}]}}]} as unknown as DocumentNode<QueryableFieldsQuery, QueryableFieldsQueryVariables>;
export const MySavedViewsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MySavedViews"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySavedViews"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseEntityType"}},{"kind":"Field","name":{"kind":"Name","value":"filterDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"sortDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"ownerUserId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isOwner"}}]}}]}}]} as unknown as DocumentNode<MySavedViewsQuery, MySavedViewsQueryVariables>;
export const SavedViewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SavedView"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedView"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseEntityType"}},{"kind":"Field","name":{"kind":"Name","value":"filterDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"sortDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"ownerUserId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isOwner"}}]}}]}}]} as unknown as DocumentNode<SavedViewQuery, SavedViewQueryVariables>;
export const CreateSavedViewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSavedView"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSavedViewInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSavedView"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseEntityType"}},{"kind":"Field","name":{"kind":"Name","value":"filterDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"sortDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"ownerUserId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isOwner"}}]}}]}}]} as unknown as DocumentNode<CreateSavedViewMutation, CreateSavedViewMutationVariables>;
export const UpdateSavedViewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSavedView"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSavedViewInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSavedView"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseEntityType"}},{"kind":"Field","name":{"kind":"Name","value":"filterDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"sortDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"ownerUserId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isOwner"}}]}}]}}]} as unknown as DocumentNode<UpdateSavedViewMutation, UpdateSavedViewMutationVariables>;
export const DeleteSavedViewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSavedView"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSavedView"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSavedViewMutation, DeleteSavedViewMutationVariables>;
export const DuplicateSavedViewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DuplicateSavedView"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"duplicateSavedView"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"baseEntityType"}},{"kind":"Field","name":{"kind":"Name","value":"filterDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"sortDefinition"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"ownerUserId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isOwner"}}]}}]}}]} as unknown as DocumentNode<DuplicateSavedViewMutation, DuplicateSavedViewMutationVariables>;
export const PatientCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PatientCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"patientCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}]}]}}]} as unknown as DocumentNode<PatientCreatedSubscription, PatientCreatedSubscriptionVariables>;
export const PatientUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PatientUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"patientId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"patientUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"patientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"patientId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}]}]}}]} as unknown as DocumentNode<PatientUpdatedSubscription, PatientUpdatedSubscriptionVariables>;
export const PatientStateChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PatientStateChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"patientId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"patientStateChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"patientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"patientId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}]}]}}]} as unknown as DocumentNode<PatientStateChangedSubscription, PatientStateChangedSubscriptionVariables>;
export const TaskCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TaskCreated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskCreated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}]}]}}]} as unknown as DocumentNode<TaskCreatedSubscription, TaskCreatedSubscriptionVariables>;
export const TaskUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TaskUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"taskId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"taskId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}]}]}}]} as unknown as DocumentNode<TaskUpdatedSubscription, TaskUpdatedSubscriptionVariables>;
export const TaskDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"TaskDeleted"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"taskDeleted"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"rootLocationIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootLocationIds"}}}]}]}}]} as unknown as DocumentNode<TaskDeletedSubscription, TaskDeletedSubscriptionVariables>;
export const LocationNodeUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LocationNodeUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locationNodeUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"locationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locationId"}}}]}]}}]} as unknown as DocumentNode<LocationNodeUpdatedSubscription, LocationNodeUpdatedSubscriptionVariables>;
export const LocationNodeCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LocationNodeCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locationNodeCreated"}}]}}]} as unknown as DocumentNode<LocationNodeCreatedSubscription, LocationNodeCreatedSubscriptionVariables>;
export const LocationNodeDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LocationNodeDeleted"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locationNodeDeleted"}}]}}]} as unknown as DocumentNode<LocationNodeDeletedSubscription, LocationNodeDeletedSubscriptionVariables>;
export const CreateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTaskMutation, CreateTaskMutationVariables>;
export const UpdateTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTaskInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedTime"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}},{"kind":"Field","name":{"kind":"Name","value":"checksum"}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"properties"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"definition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"fieldType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"allowedEntities"}},{"kind":"Field","name":{"kind":"Name","value":"options"}}]}},{"kind":"Field","name":{"kind":"Name","value":"textValue"}},{"kind":"Field","name":{"kind":"Name","value":"numberValue"}},{"kind":"Field","name":{"kind":"Name","value":"booleanValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateValue"}},{"kind":"Field","name":{"kind":"Name","value":"dateTimeValue"}},{"kind":"Field","name":{"kind":"Name","value":"selectValue"}},{"kind":"Field","name":{"kind":"Name","value":"multiSelectValues"}},{"kind":"Field","name":{"kind":"Name","value":"userValue"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const AddTaskAssigneeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTaskAssignee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTaskAssignee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}}]}}]}}]} as unknown as DocumentNode<AddTaskAssigneeMutation, AddTaskAssigneeMutationVariables>;
export const RemoveTaskAssigneeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTaskAssignee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTaskAssignee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignees"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveTaskAssigneeMutation, RemoveTaskAssigneeMutationVariables>;
export const DeleteTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const CompleteTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}}]}}]}}]} as unknown as DocumentNode<CompleteTaskMutation, CompleteTaskMutationVariables>;
export const ReopenTaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReopenTask"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reopenTask"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"done"}},{"kind":"Field","name":{"kind":"Name","value":"updateDate"}}]}}]}}]} as unknown as DocumentNode<ReopenTaskMutation, ReopenTaskMutationVariables>;
export const AssignTaskToTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AssignTaskToTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignTaskToTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]} as unknown as DocumentNode<AssignTaskToTeamMutation, AssignTaskToTeamMutationVariables>;
export const UnassignTaskFromTeamDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnassignTaskFromTeam"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unassignTaskFromTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}}]}}]}}]} as unknown as DocumentNode<UnassignTaskFromTeamMutation, UnassignTaskFromTeamMutationVariables>;
export const UpdateProfilePictureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfilePicture"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfilePictureInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfilePicture"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastOnline"}},{"kind":"Field","name":{"kind":"Name","value":"isOnline"}}]}}]}}]} as unknown as DocumentNode<UpdateProfilePictureMutation, UpdateProfilePictureMutationVariables>;