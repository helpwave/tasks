"""GraphQL query and mutation strings for the backend API. Used by the GraphQL client in tools; variable names and shapes must match the backend schema (e.g. PaginationInput with pageIndex, pageSize; locationNodeId for patients)."""

GET_PATIENT_QUERY = """
query GetPatient($id: ID!) {
  patient(id: $id) {
    id
    name
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
    tasks {
      id
      title
      description
      done
      dueDate
      priority
      estimatedTime
      updateDate
      assignees {
        id
        name
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
"""

LIST_PATIENTS_QUERY = """
query GetPatients($locationNodeId: ID, $rootLocationIds: [ID!], $states: [PatientState!], $pagination: PaginationInput) {
  patients(locationNodeId: $locationNodeId, rootLocationIds: $rootLocationIds, states: $states, pagination: $pagination) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    state
    description
    properties {
      definition {
        name
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
"""

FIND_CLINICS_BY_NAME_QUERY = """
query FindClinicsByName($search: String!, $limit: Int, $offset: Int) {
  locationNodes(
    kind: CLINIC
    search: $search
    orderByName: true
    limit: $limit
    offset: $offset
    recursive: false
  ) {
    id
    title
    kind
    parentId
  }
}
"""

LIST_CLINICS_QUERY = """
query ListClinics($limit: Int, $offset: Int) {
  locationNodes(
    kind: CLINIC
    orderByName: true
    limit: $limit
    offset: $offset
    recursive: false
  ) {
    id
    title
    kind
    parentId
  }
}
"""

GET_TASK_QUERY = """
query GetTask($id: ID!) {
  task(id: $id) {
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
    assignees {
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
"""

LIST_TASKS_QUERY = """
query GetTasks($patientId: ID, $assigneeId: ID, $assigneeTeamId: ID, $rootLocationIds: [ID!], $pagination: PaginationInput) {
  tasks(patientId: $patientId, assigneeId: $assigneeId, assigneeTeamId: $assigneeTeamId, rootLocationIds: $rootLocationIds, pagination: $pagination) {
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
    assignees {
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
"""

CREATE_PATIENT_MUTATION = """
mutation CreatePatient($data: CreatePatientInput!) {
  createPatient(data: $data) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    state
    description
    checksum
  }
}
"""

UPDATE_PATIENT_MUTATION = """
mutation UpdatePatient($id: ID!, $data: UpdatePatientInput!) {
  updatePatient(id: $id, data: $data) {
    id
    name
    firstname
    lastname
    birthdate
    sex
    state
    description
    checksum
  }
}
"""

DELETE_PATIENT_MUTATION = """
mutation DeletePatient($id: ID!) {
  deletePatient(id: $id)
}
"""

CREATE_TASK_MUTATION = """
mutation CreateTask($data: CreateTaskInput!) {
  createTask(data: $data) {
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
    assignees {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
    assigneeTeam {
      id
      title
    }
  }
}
"""

UPDATE_TASK_MUTATION = """
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
    assignees {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
    assigneeTeam {
      id
      title
    }
  }
}
"""

DELETE_TASK_MUTATION = """
mutation DeleteTask($id: ID!) {
  deleteTask(id: $id)
}
"""

ASSIGN_TASK_MUTATION = """
mutation AddTaskAssignee($id: ID!, $userId: ID!) {
  addTaskAssignee(id: $id, userId: $userId) {
    id
    assignees {
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
}
"""

ASSIGN_TASK_TO_TEAM_MUTATION = """
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
"""

COMPLETE_TASK_MUTATION = """
mutation CompleteTask($id: ID!) {
  completeTask(id: $id) {
    id
    done
    updateDate
  }
}
"""

REOPEN_TASK_MUTATION = """
mutation ReopenTask($id: ID!) {
  reopenTask(id: $id) {
    id
    done
    updateDate
  }
}
"""
