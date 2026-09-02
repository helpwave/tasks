export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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

export type ApplyTaskGraphInput = {
  assignToCurrentUser?: Scalars['Boolean']['input'];
  graph?: InputMaybe<TaskGraphInput>;
  patientId: Scalars['ID']['input'];
  presetId?: InputMaybe<Scalars['ID']['input']>;
  sourcePresetId?: InputMaybe<Scalars['ID']['input']>;
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
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  visibility?: ScopeVisibility;
};

export type CreateSavedViewInput = {
  baseEntityType: SavedViewEntityType;
  filterDefinition: Scalars['String']['input'];
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  parameters: Scalars['String']['input'];
  relatedFilterDefinition?: Scalars['String']['input'];
  relatedParameters?: Scalars['String']['input'];
  relatedSortDefinition?: Scalars['String']['input'];
  sortDefinition: Scalars['String']['input'];
  visibility?: ScopeVisibility;
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

export type CreateTaskPresetInput = {
  graph: TaskGraphInput;
  key?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  visibility?: ScopeVisibility;
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
  applyTaskGraph: Array<TaskType>;
  assignTaskToTeam: TaskType;
  clearPatientProperty: Scalars['Int']['output'];
  clearTaskProperty: Scalars['Int']['output'];
  completeTask: TaskType;
  createLocationNode: LocationNodeType;
  createPatient: PatientType;
  createPropertyDefinition: PropertyDefinitionType;
  createSavedView: SavedView;
  createTask: TaskType;
  createTaskPreset: TaskPresetType;
  deleteLocationNode: Scalars['Boolean']['output'];
  deletePatient: Scalars['Boolean']['output'];
  deletePropertyDefinition: Scalars['Boolean']['output'];
  deleteSavedView: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  deleteTaskPreset: Scalars['Boolean']['output'];
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
  updateTaskPreset: TaskPresetType;
  waitPatient: PatientType;
};


export type MutationAddTaskAssigneeArgs = {
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAdmitPatientArgs = {
  id: Scalars['ID']['input'];
};


export type MutationApplyTaskGraphArgs = {
  data: ApplyTaskGraphInput;
};


export type MutationAssignTaskToTeamArgs = {
  id: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationClearPatientPropertyArgs = {
  patientIds: Array<Scalars['ID']['input']>;
  propertyDefinitionId: Scalars['ID']['input'];
};


export type MutationClearTaskPropertyArgs = {
  propertyDefinitionId: Scalars['ID']['input'];
  taskIds: Array<Scalars['ID']['input']>;
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


export type MutationCreateTaskPresetArgs = {
  data: CreateTaskPresetInput;
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


export type MutationDeleteTaskPresetArgs = {
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


export type MutationUpdateTaskPresetArgs = {
  data: UpdateTaskPresetInput;
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
  clinicUpdateDate?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  firstname: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastname: Scalars['String']['output'];
  name: Scalars['String']['output'];
  position?: Maybe<LocationNodeType>;
  positionId?: Maybe<Scalars['ID']['output']>;
  positionUpdateDate?: Maybe<Scalars['DateTime']['output']>;
  properties: Array<PropertyValueType>;
  sex: Sex;
  state: PatientState;
  stateUpdateDate?: Maybe<Scalars['DateTime']['output']>;
  tasks: Array<TaskType>;
  teams: Array<LocationNodeType>;
  updateDate?: Maybe<Scalars['DateTime']['output']>;
};


export type PatientTypeTasksArgs = {
  done?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PropertyDefinitionType = {
  __typename?: 'PropertyDefinitionType';
  allowedEntities: Array<PropertyEntity>;
  canEdit: Scalars['Boolean']['output'];
  description?: Maybe<Scalars['String']['output']>;
  fieldType: FieldType;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  location?: Maybe<LocationNodeType>;
  locationId?: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  options: Array<Scalars['String']['output']>;
  ownerUserId?: Maybe<Scalars['ID']['output']>;
  visibility: ScopeVisibility;
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
  scopedPatientCounts: ScopedPatientCountsType;
  task?: Maybe<TaskType>;
  taskPreset?: Maybe<TaskPresetType>;
  taskPresetByKey?: Maybe<TaskPresetType>;
  taskPresets: Array<TaskPresetType>;
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


export type QueryMySavedViewsArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
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


export type QueryPropertyDefinitionsArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
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


export type QueryScopedPatientCountsArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskPresetArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskPresetByKeyArgs = {
  key: Scalars['String']['input'];
};


export type QueryTaskPresetsArgs = {
  rootLocationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
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
  NotBetween = 'NOT_BETWEEN',
  NotContains = 'NOT_CONTAINS',
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
  location?: Maybe<LocationNodeType>;
  locationId?: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  ownerUserId: Scalars['ID']['output'];
  parameters: Scalars['String']['output'];
  relatedFilterDefinition: Scalars['String']['output'];
  relatedParameters: Scalars['String']['output'];
  relatedSortDefinition: Scalars['String']['output'];
  sortDefinition: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  visibility: ScopeVisibility;
};

export enum SavedViewEntityType {
  Patient = 'PATIENT',
  Task = 'TASK'
}

export enum ScopeVisibility {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type ScopedPatientCountsType = {
  __typename?: 'ScopedPatientCountsType';
  scopedPatientsAdmitted: Scalars['Int']['output'];
  scopedPatientsDeceased: Scalars['Int']['output'];
  scopedPatientsDischarged: Scalars['Int']['output'];
  scopedPatientsTotal: Scalars['Int']['output'];
  scopedPatientsWaiting: Scalars['Int']['output'];
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

export type TaskGraphEdgeInput = {
  fromNodeId: Scalars['String']['input'];
  toNodeId: Scalars['String']['input'];
};

export type TaskGraphEdgeType = {
  __typename?: 'TaskGraphEdgeType';
  fromId: Scalars['String']['output'];
  toId: Scalars['String']['output'];
};

export type TaskGraphInput = {
  edges: Array<TaskGraphEdgeInput>;
  nodes: Array<TaskGraphNodeInput>;
};

export type TaskGraphNodeInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  estimatedTime?: InputMaybe<Scalars['Int']['input']>;
  nodeId: Scalars['String']['input'];
  priority?: InputMaybe<TaskPriority>;
  title: Scalars['String']['input'];
};

export type TaskGraphNodeType = {
  __typename?: 'TaskGraphNodeType';
  description?: Maybe<Scalars['String']['output']>;
  estimatedTime?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  priority?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type TaskGraphType = {
  __typename?: 'TaskGraphType';
  edges: Array<TaskGraphEdgeType>;
  nodes: Array<TaskGraphNodeType>;
};

export type TaskPresetType = {
  __typename?: 'TaskPresetType';
  graph: TaskGraphType;
  id: Scalars['ID']['output'];
  isOwner: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  location?: Maybe<LocationNodeType>;
  locationId?: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  ownerUserId?: Maybe<Scalars['ID']['output']>;
  visibility: ScopeVisibility;
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
  sourceTaskPresetId?: Maybe<Scalars['ID']['output']>;
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
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  visibility?: InputMaybe<ScopeVisibility>;
};

export type UpdateSavedViewInput = {
  filterDefinition?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  parameters?: InputMaybe<Scalars['String']['input']>;
  relatedFilterDefinition?: InputMaybe<Scalars['String']['input']>;
  relatedParameters?: InputMaybe<Scalars['String']['input']>;
  relatedSortDefinition?: InputMaybe<Scalars['String']['input']>;
  sortDefinition?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ScopeVisibility>;
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

export type UpdateTaskPresetInput = {
  graph?: InputMaybe<TaskGraphInput>;
  key?: InputMaybe<Scalars['String']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<ScopeVisibility>;
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
