import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { fetcher } from './fetcher';
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
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
};

export type CreateLocationNodeInput = {
  kind: LocationType;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

export type CreatePatientInput = {
  assignedLocationId?: InputMaybe<Scalars['ID']['input']>;
  birthdate: Scalars['Date']['input'];
  firstname: Scalars['String']['input'];
  lastname: Scalars['String']['input'];
  properties?: InputMaybe<Array<PropertyValueInput>>;
  sex: Sex;
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
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  patientId: Scalars['ID']['input'];
  previousTaskIds?: InputMaybe<Array<Scalars['ID']['input']>>;
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

export type LocationNodeType = {
  __typename?: 'LocationNodeType';
  children: Array<LocationNodeType>;
  id: Scalars['ID']['output'];
  kind: LocationType;
  parent?: Maybe<LocationNodeType>;
  parentId?: Maybe<Scalars['ID']['output']>;
  patients: Array<PatientType>;
  title: Scalars['String']['output'];
};

export enum LocationType {
  Bed = 'BED',
  Clinic = 'CLINIC',
  Other = 'OTHER',
  Room = 'ROOM',
  Team = 'TEAM',
  Ward = 'WARD'
}

export type Mutation = {
  __typename?: 'Mutation';
  assignTask: TaskType;
  completeTask: TaskType;
  createLocationNode: LocationNodeType;
  createPatient: PatientType;
  createPropertyDefinition: PropertyDefinitionType;
  createTask: TaskType;
  deleteLocationNode: Scalars['Boolean']['output'];
  deletePatient: Scalars['Boolean']['output'];
  deletePropertyDefinition: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  reopenTask: TaskType;
  unassignTask: TaskType;
  updateLocationNode: LocationNodeType;
  updatePatient: PatientType;
  updatePropertyDefinition: PropertyDefinitionType;
  updateTask: TaskType;
};


export type MutationAssignTaskArgs = {
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
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


export type MutationReopenTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnassignTaskArgs = {
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


export type MutationUpdatePropertyDefinitionArgs = {
  data: UpdatePropertyDefinitionInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateTaskArgs = {
  data: UpdateTaskInput;
  id: Scalars['ID']['input'];
};

export type PatientType = {
  __typename?: 'PatientType';
  age: Scalars['Int']['output'];
  assignedLocation?: Maybe<LocationNodeType>;
  assignedLocationId?: Maybe<Scalars['ID']['output']>;
  birthdate: Scalars['Date']['output'];
  firstname: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastname: Scalars['String']['output'];
  name: Scalars['String']['output'];
  properties: Array<PropertyValueType>;
  sex: Sex;
  tasks: Array<TaskType>;
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
  locationNode?: Maybe<LocationNodeType>;
  locationNodes: Array<LocationNodeType>;
  locationRoots: Array<LocationNodeType>;
  me?: Maybe<UserType>;
  patient?: Maybe<PatientType>;
  patients: Array<PatientType>;
  propertyDefinitions: Array<PropertyDefinitionType>;
  recentPatients: Array<PatientType>;
  recentTasks: Array<TaskType>;
  task?: Maybe<TaskType>;
  tasks: Array<TaskType>;
  user?: Maybe<UserType>;
  users: Array<UserType>;
};


export type QueryLocationNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLocationNodesArgs = {
  kind?: InputMaybe<LocationType>;
  orderByName?: Scalars['Boolean']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  recursive?: Scalars['Boolean']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPatientArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPatientsArgs = {
  locationNodeId?: InputMaybe<Scalars['ID']['input']>;
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
  patientId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

export enum Sex {
  Female = 'FEMALE',
  Male = 'MALE',
  Unknown = 'UNKNOWN'
}

export type Subscription = {
  __typename?: 'Subscription';
  patientCreated: Scalars['ID']['output'];
};

export type TaskType = {
  __typename?: 'TaskType';
  assignee?: Maybe<UserType>;
  assigneeId?: Maybe<Scalars['ID']['output']>;
  creationDate: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  done: Scalars['Boolean']['output'];
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  patient: PatientType;
  patientId: Scalars['ID']['output'];
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
  birthdate?: InputMaybe<Scalars['Date']['input']>;
  firstname?: InputMaybe<Scalars['String']['input']>;
  lastname?: InputMaybe<Scalars['String']['input']>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  sex?: InputMaybe<Sex>;
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
  description?: InputMaybe<Scalars['String']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  previousTaskIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  properties?: InputMaybe<Array<PropertyValueInput>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UserType = {
  __typename?: 'UserType';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  firstname?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastname?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  tasks: Array<TaskType>;
  title?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};

export type GetLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLocationsQuery = { __typename?: 'Query', locationNodes: Array<{ __typename?: 'LocationNodeType', id: string, title: string, kind: LocationType, parentId?: string | null }> };

export type GetMyTasksQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyTasksQuery = { __typename?: 'Query', me?: { __typename?: 'UserType', id: string, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, creationDate: any, updateDate?: any | null, patient: { __typename?: 'PatientType', id: string, name: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null }, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null } | null }> } | null };

export type GetOverviewDataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOverviewDataQuery = { __typename?: 'Query', recentPatients: Array<{ __typename?: 'PatientType', id: string, name: string, sex: Sex, birthdate: any, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null }>, recentTasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, updateDate?: any | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null } | null, patient: { __typename?: 'PatientType', id: string, name: string } }> };

export type GetPatientsQueryVariables = Exact<{
  locationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetPatientsQuery = { __typename?: 'Query', patients: Array<{ __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string, parent?: { __typename?: 'LocationNodeType', id: string, title: string } | null } | null, tasks: Array<{ __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null } | null }>, properties: Array<{ __typename?: 'PropertyValueType', textValue?: string | null, definition: { __typename?: 'PropertyDefinitionType', name: string } }> }> };

export type GetUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null }> };

export type GetGlobalDataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGlobalDataQuery = { __typename?: 'Query', me?: { __typename?: 'UserType', id: string, username: string, name: string, firstname?: string | null, lastname?: string | null, avatarUrl?: string | null, tasks: Array<{ __typename?: 'TaskType', id: string, done: boolean }> } | null, wards: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, teams: Array<{ __typename?: 'LocationNodeType', id: string, title: string }>, patients: Array<{ __typename?: 'PatientType', id: string, assignedLocation?: { __typename?: 'LocationNodeType', id: string } | null }> };

export type CreatePatientMutationVariables = Exact<{
  data: CreatePatientInput;
}>;


export type CreatePatientMutation = { __typename?: 'Mutation', createPatient: { __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null } };

export type UpdatePatientMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdatePatientInput;
}>;


export type UpdatePatientMutation = { __typename?: 'Mutation', updatePatient: { __typename?: 'PatientType', id: string, name: string, firstname: string, lastname: string, birthdate: any, sex: Sex, assignedLocation?: { __typename?: 'LocationNodeType', id: string, title: string } | null } };

export type CreateTaskMutationVariables = Exact<{
  data: CreateTaskInput;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, updateDate?: any | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null } | null, patient: { __typename?: 'PatientType', id: string, name: string } } };

export type UpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'TaskType', id: string, title: string, description?: string | null, done: boolean, dueDate?: any | null, updateDate?: any | null, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null } | null } };

export type AssignTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
}>;


export type AssignTaskMutation = { __typename?: 'Mutation', assignTask: { __typename?: 'TaskType', id: string, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null } | null } };

export type UnassignTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnassignTaskMutation = { __typename?: 'Mutation', unassignTask: { __typename?: 'TaskType', id: string, assignee?: { __typename?: 'UserType', id: string, name: string, avatarUrl?: string | null } | null } };

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



export const GetLocationsDocument = `
    query GetLocations {
  locationNodes {
    id
    title
    kind
    parentId
  }
}
    `;

export const useGetLocationsQuery = <
      TData = GetLocationsQuery,
      TError = unknown
    >(
      variables?: GetLocationsQueryVariables,
      options?: Omit<UseQueryOptions<GetLocationsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetLocationsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetLocationsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetLocations'] : ['GetLocations', variables],
    queryFn: fetcher<GetLocationsQuery, GetLocationsQueryVariables>(GetLocationsDocument, variables),
    ...options
  }
    )};

export const GetMyTasksDocument = `
    query GetMyTasks {
  me {
    id
    tasks {
      id
      title
      description
      done
      dueDate
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
      }
      assignee {
        id
        name
        avatarUrl
      }
    }
  }
}
    `;

export const useGetMyTasksQuery = <
      TData = GetMyTasksQuery,
      TError = unknown
    >(
      variables?: GetMyTasksQueryVariables,
      options?: Omit<UseQueryOptions<GetMyTasksQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetMyTasksQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetMyTasksQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetMyTasks'] : ['GetMyTasks', variables],
    queryFn: fetcher<GetMyTasksQuery, GetMyTasksQueryVariables>(GetMyTasksDocument, variables),
    ...options
  }
    )};

export const GetOverviewDataDocument = `
    query GetOverviewData {
  recentPatients(limit: 5) {
    id
    name
    sex
    birthdate
    assignedLocation {
      id
      title
      parent {
        id
        title
      }
    }
  }
  recentTasks(limit: 10) {
    id
    title
    description
    done
    updateDate
    assignee {
      id
      name
      avatarUrl
    }
    patient {
      id
      name
    }
  }
}
    `;

export const useGetOverviewDataQuery = <
      TData = GetOverviewDataQuery,
      TError = unknown
    >(
      variables?: GetOverviewDataQueryVariables,
      options?: Omit<UseQueryOptions<GetOverviewDataQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetOverviewDataQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetOverviewDataQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetOverviewData'] : ['GetOverviewData', variables],
    queryFn: fetcher<GetOverviewDataQuery, GetOverviewDataQueryVariables>(GetOverviewDataDocument, variables),
    ...options
  }
    )};

export const GetPatientsDocument = `
    query GetPatients($locationId: ID) {
  patients(locationNodeId: $locationId) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    assignedLocation {
      id
      title
      parent {
        id
        title
      }
    }
    tasks {
      id
      title
      description
      done
      dueDate
      assignee {
        id
        name
        avatarUrl
      }
    }
    properties {
      definition {
        name
      }
      textValue
    }
  }
}
    `;

export const useGetPatientsQuery = <
      TData = GetPatientsQuery,
      TError = unknown
    >(
      variables?: GetPatientsQueryVariables,
      options?: Omit<UseQueryOptions<GetPatientsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetPatientsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetPatientsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetPatients'] : ['GetPatients', variables],
    queryFn: fetcher<GetPatientsQuery, GetPatientsQueryVariables>(GetPatientsDocument, variables),
    ...options
  }
    )};

export const GetUsersDocument = `
    query GetUsers {
  users {
    id
    name
    avatarUrl
  }
}
    `;

export const useGetUsersQuery = <
      TData = GetUsersQuery,
      TError = unknown
    >(
      variables?: GetUsersQueryVariables,
      options?: Omit<UseQueryOptions<GetUsersQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetUsersQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetUsersQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetUsers'] : ['GetUsers', variables],
    queryFn: fetcher<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, variables),
    ...options
  }
    )};

export const GetGlobalDataDocument = `
    query GetGlobalData {
  me {
    id
    username
    name
    firstname
    lastname
    avatarUrl
    tasks {
      id
      done
    }
  }
  wards: locationNodes(kind: WARD) {
    id
    title
  }
  teams: locationNodes(kind: TEAM) {
    id
    title
  }
  patients {
    id
    assignedLocation {
      id
    }
  }
}
    `;

export const useGetGlobalDataQuery = <
      TData = GetGlobalDataQuery,
      TError = unknown
    >(
      variables?: GetGlobalDataQueryVariables,
      options?: Omit<UseQueryOptions<GetGlobalDataQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetGlobalDataQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetGlobalDataQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetGlobalData'] : ['GetGlobalData', variables],
    queryFn: fetcher<GetGlobalDataQuery, GetGlobalDataQueryVariables>(GetGlobalDataDocument, variables),
    ...options
  }
    )};

export const CreatePatientDocument = `
    mutation CreatePatient($data: CreatePatientInput!) {
  createPatient(data: $data) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    assignedLocation {
      id
      title
    }
  }
}
    `;

export const useCreatePatientMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreatePatientMutation, TError, CreatePatientMutationVariables, TContext>) => {
    
    return useMutation<CreatePatientMutation, TError, CreatePatientMutationVariables, TContext>(
      {
    mutationKey: ['CreatePatient'],
    mutationFn: (variables?: CreatePatientMutationVariables) => fetcher<CreatePatientMutation, CreatePatientMutationVariables>(CreatePatientDocument, variables)(),
    ...options
  }
    )};

export const UpdatePatientDocument = `
    mutation UpdatePatient($id: ID!, $data: UpdatePatientInput!) {
  updatePatient(id: $id, data: $data) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    assignedLocation {
      id
      title
    }
  }
}
    `;

export const useUpdatePatientMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdatePatientMutation, TError, UpdatePatientMutationVariables, TContext>) => {
    
    return useMutation<UpdatePatientMutation, TError, UpdatePatientMutationVariables, TContext>(
      {
    mutationKey: ['UpdatePatient'],
    mutationFn: (variables?: UpdatePatientMutationVariables) => fetcher<UpdatePatientMutation, UpdatePatientMutationVariables>(UpdatePatientDocument, variables)(),
    ...options
  }
    )};

export const CreateTaskDocument = `
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
    }
    patient {
      id
      name
    }
  }
}
    `;

export const useCreateTaskMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateTaskMutation, TError, CreateTaskMutationVariables, TContext>) => {
    
    return useMutation<CreateTaskMutation, TError, CreateTaskMutationVariables, TContext>(
      {
    mutationKey: ['CreateTask'],
    mutationFn: (variables?: CreateTaskMutationVariables) => fetcher<CreateTaskMutation, CreateTaskMutationVariables>(CreateTaskDocument, variables)(),
    ...options
  }
    )};

export const UpdateTaskDocument = `
    mutation UpdateTask($id: ID!, $data: UpdateTaskInput!) {
  updateTask(id: $id, data: $data) {
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
    }
  }
}
    `;

export const useUpdateTaskMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateTaskMutation, TError, UpdateTaskMutationVariables, TContext>) => {
    
    return useMutation<UpdateTaskMutation, TError, UpdateTaskMutationVariables, TContext>(
      {
    mutationKey: ['UpdateTask'],
    mutationFn: (variables?: UpdateTaskMutationVariables) => fetcher<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, variables)(),
    ...options
  }
    )};

export const AssignTaskDocument = `
    mutation AssignTask($id: ID!, $userId: ID!) {
  assignTask(id: $id, userId: $userId) {
    id
    assignee {
      id
      name
      avatarUrl
    }
  }
}
    `;

export const useAssignTaskMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<AssignTaskMutation, TError, AssignTaskMutationVariables, TContext>) => {
    
    return useMutation<AssignTaskMutation, TError, AssignTaskMutationVariables, TContext>(
      {
    mutationKey: ['AssignTask'],
    mutationFn: (variables?: AssignTaskMutationVariables) => fetcher<AssignTaskMutation, AssignTaskMutationVariables>(AssignTaskDocument, variables)(),
    ...options
  }
    )};

export const UnassignTaskDocument = `
    mutation UnassignTask($id: ID!) {
  unassignTask(id: $id) {
    id
    assignee {
      id
      name
      avatarUrl
    }
  }
}
    `;

export const useUnassignTaskMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UnassignTaskMutation, TError, UnassignTaskMutationVariables, TContext>) => {
    
    return useMutation<UnassignTaskMutation, TError, UnassignTaskMutationVariables, TContext>(
      {
    mutationKey: ['UnassignTask'],
    mutationFn: (variables?: UnassignTaskMutationVariables) => fetcher<UnassignTaskMutation, UnassignTaskMutationVariables>(UnassignTaskDocument, variables)(),
    ...options
  }
    )};

export const DeleteTaskDocument = `
    mutation DeleteTask($id: ID!) {
  deleteTask(id: $id)
}
    `;

export const useDeleteTaskMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteTaskMutation, TError, DeleteTaskMutationVariables, TContext>) => {
    
    return useMutation<DeleteTaskMutation, TError, DeleteTaskMutationVariables, TContext>(
      {
    mutationKey: ['DeleteTask'],
    mutationFn: (variables?: DeleteTaskMutationVariables) => fetcher<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, variables)(),
    ...options
  }
    )};

export const CompleteTaskDocument = `
    mutation CompleteTask($id: ID!) {
  completeTask(id: $id) {
    id
    done
    updateDate
  }
}
    `;

export const useCompleteTaskMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CompleteTaskMutation, TError, CompleteTaskMutationVariables, TContext>) => {
    
    return useMutation<CompleteTaskMutation, TError, CompleteTaskMutationVariables, TContext>(
      {
    mutationKey: ['CompleteTask'],
    mutationFn: (variables?: CompleteTaskMutationVariables) => fetcher<CompleteTaskMutation, CompleteTaskMutationVariables>(CompleteTaskDocument, variables)(),
    ...options
  }
    )};

export const ReopenTaskDocument = `
    mutation ReopenTask($id: ID!) {
  reopenTask(id: $id) {
    id
    done
    updateDate
  }
}
    `;

export const useReopenTaskMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<ReopenTaskMutation, TError, ReopenTaskMutationVariables, TContext>) => {
    
    return useMutation<ReopenTaskMutation, TError, ReopenTaskMutationVariables, TContext>(
      {
    mutationKey: ['ReopenTask'],
    mutationFn: (variables?: ReopenTaskMutationVariables) => fetcher<ReopenTaskMutation, ReopenTaskMutationVariables>(ReopenTaskDocument, variables)(),
    ...options
  }
    )};
