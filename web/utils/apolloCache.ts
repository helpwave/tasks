import { InMemoryCache, FieldPolicy, TypePolicy } from '@apollo/client'

const mergePaginatedResults: FieldPolicy = {
  keyArgs: (args) => {
    const keyArgs: string[] = []
    if (args?.rootLocationIds) keyArgs.push('rootLocationIds')
    if (args?.assigneeId) keyArgs.push('assigneeId')
    if (args?.assigneeTeamId) keyArgs.push('assigneeTeamId')
    if (args?.states) keyArgs.push('states')
    if (args?.locationId) keyArgs.push('locationId')
    return JSON.stringify(keyArgs)
  },
  merge(existing, incoming, { args }) {
    if (!args?.pagination) {
      return incoming
    }

    if (!existing) {
      return incoming
    }

    const existingData = existing.data || []
    const incomingData = incoming.data || []

    return {
      ...incoming,
      data: [...existingData, ...incomingData],
      totalCount: incoming.totalCount ?? existing.totalCount,
    }
  },
}

const mergeTasksField: FieldPolicy = {
  merge(existing, incoming) {
    if (!existing) {
      return incoming
    }

    const existingTasks = existing || []
    const incomingTasks = incoming || []

    const taskMap = new Map(existingTasks.map((task: any) => [task.id, task]))
    incomingTasks.forEach((task: any) => {
      taskMap.set(task.id, task)
    })

    return Array.from(taskMap.values())
  },
}

const typePolicies: Record<string, TypePolicy> = {
  Query: {
    fields: {
      tasks: mergePaginatedResults,
      patients: mergePaginatedResults,
      me: {
        fields: {
          tasks: mergeTasksField,
        },
      },
    },
  },
  TaskType: {
    keyFields: ['id'],
  },
  PatientType: {
    keyFields: ['id'],
  },
  LocationNodeType: {
    keyFields: ['id'],
  },
  UserType: {
    keyFields: ['id'],
  },
  PropertyDefinitionType: {
    keyFields: ['id'],
  },
  PropertyValueType: {
    keyFields: ['definition', 'id'],
  },
}

export const cache = new InMemoryCache({
  typePolicies,
})
