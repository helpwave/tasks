import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { fetcher } from './fetcher'
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string, output: string },
  String: { input: string, output: string },
  Boolean: { input: boolean, output: boolean },
  Int: { input: number, output: number },
  Float: { input: number, output: number },
  Date: { input: any, output: any },
  DateTime: { input: any, output: any },
};

export type CreateLocationNodeInput = {
  kind: LocationType,
  parentId?: InputMaybe<Scalars['ID']['input']>,
  title: Scalars['String']['input'],
};

export type CreatePatientInput = {
  assignedLocationId?: InputMaybe<Scalars['ID']['input']>,
  birthdate: Scalars['Date']['input'],
  firstname: Scalars['String']['input'],
  gender: Gender,
  lastname: Scalars['String']['input'],
  properties?: InputMaybe<Array<PropertyValueInput>>,
};

export type CreatePropertyDefinitionInput = {
  allowedEntities: Array<PropertyEntity>,
  description?: InputMaybe<Scalars['String']['input']>,
  fieldType: FieldType,
  isActive?: Scalars['Boolean']['input'],
  name: Scalars['String']['input'],
  options?: InputMaybe<Array<Scalars['String']['input']>>,
};

export type CreateTaskInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>,
  description?: InputMaybe<Scalars['String']['input']>,
  patientId: Scalars['ID']['input'],
  previousTaskIds?: InputMaybe<Array<Scalars['ID']['input']>>,
  properties?: InputMaybe<Array<PropertyValueInput>>,
  title: Scalars['String']['input'],
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

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  Unknown = 'UNKNOWN'
}

export type LocationNodeType = {
  __typename?: 'LocationNodeType',
  children: Array<LocationNodeType>,
  id: Scalars['ID']['output'],
  kind: LocationType,
  parent?: Maybe<LocationNodeType>,
  parentId?: Maybe<Scalars['ID']['output']>,
  title: Scalars['String']['output'],
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
  __typename?: 'Mutation',
  createLocationNode: LocationNodeType,
  createPatient: PatientType,
  createPropertyDefinition: PropertyDefinitionType,
  createTask: TaskType,
  deleteLocationNode: Scalars['Boolean']['output'],
  deletePatient: Scalars['Boolean']['output'],
  deletePropertyDefinition: Scalars['Boolean']['output'],
  deleteTask: Scalars['Boolean']['output'],
  updateLocationNode: LocationNodeType,
  updatePatient: PatientType,
  updatePropertyDefinition: PropertyDefinitionType,
  updateTask: TaskType,
};


export type MutationCreateLocationNodeArgs = {
  data: CreateLocationNodeInput,
};


export type MutationCreatePatientArgs = {
  data: CreatePatientInput,
};


export type MutationCreatePropertyDefinitionArgs = {
  data: CreatePropertyDefinitionInput,
};


export type MutationCreateTaskArgs = {
  data: CreateTaskInput,
};


export type MutationDeleteLocationNodeArgs = {
  id: Scalars['ID']['input'],
};


export type MutationDeletePatientArgs = {
  id: Scalars['ID']['input'],
};


export type MutationDeletePropertyDefinitionArgs = {
  id: Scalars['ID']['input'],
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'],
};


export type MutationUpdateLocationNodeArgs = {
  data: UpdateLocationNodeInput,
  id: Scalars['ID']['input'],
};


export type MutationUpdatePatientArgs = {
  data: UpdatePatientInput,
  id: Scalars['ID']['input'],
};


export type MutationUpdatePropertyDefinitionArgs = {
  data: UpdatePropertyDefinitionInput,
  id: Scalars['ID']['input'],
};


export type MutationUpdateTaskArgs = {
  data: UpdateTaskInput,
  id: Scalars['ID']['input'],
};

export type PatientType = {
  __typename?: 'PatientType',
  age: Scalars['Int']['output'],
  assignedLocation?: Maybe<LocationNodeType>,
  assignedLocationId?: Maybe<Scalars['ID']['output']>,
  birthdate: Scalars['Date']['output'],
  firstname: Scalars['String']['output'],
  gender: Gender,
  id: Scalars['ID']['output'],
  lastname: Scalars['String']['output'],
  name: Scalars['String']['output'],
  properties: Array<PropertyValueType>,
  tasks: Array<TaskType>,
};


export type PatientTypeTasksArgs = {
  done?: InputMaybe<Scalars['Boolean']['input']>,
};

export type PropertyDefinitionType = {
  __typename?: 'PropertyDefinitionType',
  allowedEntities: Array<PropertyEntity>,
  description?: Maybe<Scalars['String']['output']>,
  fieldType: FieldType,
  id: Scalars['ID']['output'],
  isActive: Scalars['Boolean']['output'],
  name: Scalars['String']['output'],
  options: Array<Scalars['String']['output']>,
};

export enum PropertyEntity {
  Patient = 'PATIENT',
  Task = 'TASK'
}

export type PropertyValueInput = {
  booleanValue?: InputMaybe<Scalars['Boolean']['input']>,
  dateTimeValue?: InputMaybe<Scalars['DateTime']['input']>,
  dateValue?: InputMaybe<Scalars['Date']['input']>,
  definitionId: Scalars['ID']['input'],
  multiSelectValues?: InputMaybe<Array<Scalars['String']['input']>>,
  numberValue?: InputMaybe<Scalars['Float']['input']>,
  selectValue?: InputMaybe<Scalars['String']['input']>,
  textValue?: InputMaybe<Scalars['String']['input']>,
};

export type PropertyValueType = {
  __typename?: 'PropertyValueType',
  booleanValue?: Maybe<Scalars['Boolean']['output']>,
  dateTimeValue?: Maybe<Scalars['DateTime']['output']>,
  dateValue?: Maybe<Scalars['Date']['output']>,
  definition: PropertyDefinitionType,
  multiSelectValues?: Maybe<Array<Scalars['String']['output']>>,
  numberValue?: Maybe<Scalars['Float']['output']>,
  selectValue?: Maybe<Scalars['String']['output']>,
  textValue?: Maybe<Scalars['String']['output']>,
};

export type Query = {
  __typename?: 'Query',
  locationNode?: Maybe<LocationNodeType>,
  locationRoots: Array<LocationNodeType>,
  patient?: Maybe<PatientType>,
  patients: Array<PatientType>,
  propertyDefinitions: Array<PropertyDefinitionType>,
  task?: Maybe<TaskType>,
  tasks: Array<TaskType>,
};


export type QueryLocationNodeArgs = {
  id: Scalars['ID']['input'],
};


export type QueryPatientArgs = {
  id: Scalars['ID']['input'],
};


export type QueryPatientsArgs = {
  locationNodeId?: InputMaybe<Scalars['ID']['input']>,
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'],
};


export type QueryTasksArgs = {
  patientId?: InputMaybe<Scalars['ID']['input']>,
};

export type Subscription = {
  __typename?: 'Subscription',
  patientCreated: Scalars['ID']['output'],
};

export type TaskType = {
  __typename?: 'TaskType',
  assignee?: Maybe<UserType>,
  assigneeId?: Maybe<Scalars['ID']['output']>,
  creationDate: Scalars['DateTime']['output'],
  description?: Maybe<Scalars['String']['output']>,
  done: Scalars['Boolean']['output'],
  id: Scalars['ID']['output'],
  properties: Array<PropertyValueType>,
  title: Scalars['String']['output'],
  updateDate?: Maybe<Scalars['DateTime']['output']>,
};

export type UpdateLocationNodeInput = {
  kind?: InputMaybe<LocationType>,
  parentId?: InputMaybe<Scalars['ID']['input']>,
  title?: InputMaybe<Scalars['String']['input']>,
};

export type UpdatePatientInput = {
  assignedLocationId?: InputMaybe<Scalars['ID']['input']>,
  birthdate?: InputMaybe<Scalars['Date']['input']>,
  firstname?: InputMaybe<Scalars['String']['input']>,
  gender?: InputMaybe<Gender>,
  lastname?: InputMaybe<Scalars['String']['input']>,
  properties?: InputMaybe<Array<PropertyValueInput>>,
};

export type UpdatePropertyDefinitionInput = {
  allowedEntities?: InputMaybe<Array<PropertyEntity>>,
  description?: InputMaybe<Scalars['String']['input']>,
  isActive?: InputMaybe<Scalars['Boolean']['input']>,
  name?: InputMaybe<Scalars['String']['input']>,
  options?: InputMaybe<Array<Scalars['String']['input']>>,
};

export type UpdateTaskInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>,
  description?: InputMaybe<Scalars['String']['input']>,
  done?: InputMaybe<Scalars['Boolean']['input']>,
  previousTaskIds?: InputMaybe<Array<Scalars['ID']['input']>>,
  properties?: InputMaybe<Array<PropertyValueInput>>,
  title?: InputMaybe<Scalars['String']['input']>,
};

export type UserType = {
  __typename?: 'UserType',
  avatarUrl?: Maybe<Scalars['String']['output']>,
  firstname?: Maybe<Scalars['String']['output']>,
  id: Scalars['ID']['output'],
  lastname?: Maybe<Scalars['String']['output']>,
  name: Scalars['String']['output'],
  title?: Maybe<Scalars['String']['output']>,
};

export type MyQueryQueryVariables = Exact<{ [key: string]: never }>;


export type MyQueryQuery = { __typename?: 'Query', tasks: Array<{ __typename?: 'TaskType', creationDate: any, description?: string | null, done: boolean, id: string, title: string, updateDate?: any | null, assignee?: { __typename?: 'UserType', avatarUrl?: string | null, id: string, name: string } | null }> };



export const MyQueryDocument = `
    query MyQuery {
  tasks(patientId: "") {
    assignee {
      avatarUrl
      id
      name
    }
    creationDate
    description
    done
    id
    title
    updateDate
  }
}
    `

export const useMyQueryQuery = <
      TData = MyQueryQuery,
      TError = unknown
    >(
      variables?: MyQueryQueryVariables,
      options?: Omit<UseQueryOptions<MyQueryQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MyQueryQuery, TError, TData>['queryKey'] }
    ) => {

    return useQuery<MyQueryQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MyQuery'] : ['MyQuery', variables],
    queryFn: fetcher<MyQueryQuery, MyQueryQueryVariables>(MyQueryDocument, variables),
    ...options
  }
    )}
