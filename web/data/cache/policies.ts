import type { InMemoryCacheConfig } from '@apollo/client/cache'

export function buildCacheConfig(): InMemoryCacheConfig {
  return {
    typePolicies: {
      Query: {
        fields: {
          task: { keyArgs: ['id'] },
          tasks: {
            keyArgs: ['rootLocationIds', 'assigneeId', 'assigneeTeamId', 'filtering', 'sorting', 'search'],
          },
          patient: { keyArgs: ['id'] },
          patients: {
            keyArgs: ['rootLocationIds', 'states', 'filtering', 'sorting', 'search'],
          },
          locationNode: { keyArgs: ['id'] },
          locationNodes: {
            keyArgs: ['limit', 'offset', 'kind'],
            merge: (_existing, incoming) => incoming,
          },
          users: { keyArgs: [] },
          me: { keyArgs: [] },
        },
      },
      Task: { keyFields: ['id'] },
      Patient: { keyFields: ['id'] },
      User: { keyFields: ['id'] },
      UserType: { keyFields: ['id'] },
      LocationNode: { keyFields: ['id'] },
      LocationNodeType: { keyFields: ['id'] },
      PropertyValue: { keyFields: ['definition'] },
      PropertyValueType: { keyFields: ['definition'] },
      PropertyDefinitionType: { keyFields: ['id'] },
    },
  }
}
