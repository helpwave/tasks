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
  }
}
"""

LIST_PATIENTS_QUERY = """
query GetPatients($locationId: ID, $rootLocationIds: [ID!], $states: [PatientState!], $limit: Int, $offset: Int) {
  patients(locationNodeId: $locationId, rootLocationIds: $rootLocationIds, states: $states, limit: $limit, offset: $offset) {
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
      firstname
      lastname
      birthdate
    }
    assignee {
      id
      name
    }
    assigneeTeam {
      id
      title
    }
  }
}
"""

LIST_TASKS_QUERY = """
query GetTasks($patientId: ID, $assigneeId: ID, $assigneeTeamId: ID, $rootLocationIds: [ID!], $limit: Int, $offset: Int) {
  tasks(patientId: $patientId, assigneeId: $assigneeId, assigneeTeamId: $assigneeTeamId, rootLocationIds: $rootLocationIds, limit: $limit, offset: $offset) {
    id
    title
    description
    done
    dueDate
    priority
    estimatedTime
    updateDate
    patient {
      id
      firstname
      lastname
      birthdate
    }
    assignee {
      id
      name
    }
    assigneeTeam {
      id
      title
    }
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
    assignee {
      id
      name
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
    assignee {
      id
      name
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
mutation AssignTask($id: ID!, $userId: ID!) {
  assignTask(id: $id, userId: $userId) {
    id
    assignee {
      id
      name
    }
    assigneeTeam {
      id
      title
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
    }
    assignee {
      id
      name
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
