import { gql } from '@apollo/client'

export const TASK_FIELDS = gql`
  fragment TaskFields on TaskType {
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
    patient {
      id
      name
    }
  }
`

export const PATIENT_FIELDS = gql`
  fragment PatientFields on PatientType {
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
  }
`

export const LOCATION_NODE_FIELDS = gql`
  fragment LocationNodeFields on LocationNodeType {
    id
    title
    kind
    parentId
  }
`

export const PROPERTY_VALUE_FIELDS = gql`
  fragment PropertyValueFields on PropertyValueType {
    textValue
    numberValue
    booleanValue
    dateValue
    dateTimeValue
    selectValue
    multiSelectValues
    definition {
      id
      name
      description
      fieldType
      isActive
      allowedEntities
      options
    }
  }
`
