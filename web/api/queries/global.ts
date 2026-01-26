import { gql } from '@apollo/client'
import { createQueryHook } from './base'

export const GET_GLOBAL_DATA = gql`
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
`

export const GET_OVERVIEW_DATA = gql`
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
`

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($caseId: ID!, $limit: Int, $offset: Int) {
    auditLogs(caseId: $caseId, limit: $limit, offset: $offset) {
      caseId
      activity
      userId
      timestamp
      context
    }
  }
`

export interface GetGlobalDataVariables {
  rootLocationIds?: string[] | null
}

export interface GetGlobalDataData {
  me?: {
    __typename?: 'UserType'
    id: string
    username: string
    name: string
    firstname: string
    lastname: string
    avatarUrl?: string | null
    lastOnline?: string | null
    isOnline: boolean
    organizations: Array<string>
    rootLocations: Array<{
      __typename?: 'LocationNodeType'
      id: string
      title: string
      kind: string
    }>
    tasks: Array<{
      __typename?: 'TaskType'
      id: string
      done: boolean
    }>
  } | null
  wards: Array<{
    __typename?: 'LocationNodeType'
    id: string
    title: string
    parentId?: string | null
  }>
  teams: Array<{
    __typename?: 'LocationNodeType'
    id: string
    title: string
    parentId?: string | null
  }>
  clinics: Array<{
    __typename?: 'LocationNodeType'
    id: string
    title: string
    parentId?: string | null
  }>
  patients: {
    __typename?: 'PatientsResponse'
    data: Array<{
      __typename?: 'PatientType'
      id: string
      state: string
      assignedLocation?: {
        __typename?: 'LocationNodeType'
        id: string
      } | null
    }>
  }
  waitingPatients: {
    __typename?: 'PatientsResponse'
    data: Array<{
      __typename?: 'PatientType'
      id: string
      state: string
    }>
  }
}

export interface GetOverviewDataVariables {
}

export interface GetOverviewDataData {
  recentPatients: Array<{
    __typename?: 'PatientType'
    id: string
    name: string
    sex: string
    birthdate: string
    position?: {
      __typename?: 'LocationNodeType'
      id: string
      title: string
      kind: string
      parent?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
      } | null
    } | null
    tasks: Array<{
      __typename?: 'TaskType'
      updateDate?: string | null
    }>
  }>
  recentTasks: Array<{
    __typename?: 'TaskType'
    id: string
    title: string
    description?: string | null
    done: boolean
    dueDate?: string | null
    updateDate?: string | null
    priority?: string | null
    assignee?: {
      __typename?: 'UserType'
      id: string
      name: string
      avatarUrl?: string | null
      lastOnline?: string | null
      isOnline: boolean
    } | null
    patient: {
      __typename?: 'PatientType'
      id: string
      name: string
      position?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        kind: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
        } | null
      } | null
    }
  }>
}

export interface GetAuditLogsVariables {
  caseId: string
  limit?: number | null
  offset?: number | null
}

export interface GetAuditLogsData {
  auditLogs: Array<{
    __typename?: 'AuditLogType'
    caseId: string
    activity: string
    userId?: string | null
    timestamp: string
    context?: string | null
  }>
}

export const useGetGlobalDataQuery = createQueryHook<GetGlobalDataData, GetGlobalDataVariables>(GET_GLOBAL_DATA)
export const useGetOverviewDataQuery = createQueryHook<GetOverviewDataData, GetOverviewDataVariables>(GET_OVERVIEW_DATA)
export const useGetAuditLogsQuery = createQueryHook<GetAuditLogsData, GetAuditLogsVariables>(GET_AUDIT_LOGS)
