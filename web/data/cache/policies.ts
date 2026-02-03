import type { InMemoryCacheConfig } from '@apollo/client/cache'

const propertyValueKeyFields = (object: Readonly<Record<string, unknown>>): readonly ['id'] | false => {
  const id = object?.['id']
  return id != null && id !== '' ? ['id'] : false
}

export function buildCacheConfig(): InMemoryCacheConfig {
  return {
    typePolicies: {
      Query: {
        fields: {
          task: { keyArgs: ['id'] },
          tasks: {
            keyArgs: ['rootLocationIds', 'assigneeId', 'assigneeTeamId', 'filtering', 'sorting', 'search', 'pagination'],
          },
          patient: { keyArgs: ['id'] },
          patients: {
            keyArgs: ['locationId', 'rootLocationIds', 'states', 'filtering', 'sorting', 'search', 'pagination'],
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
      PropertyValue: { keyFields: propertyValueKeyFields },
      PropertyValueType: { keyFields: propertyValueKeyFields },
      PropertyDefinitionType: { keyFields: ['id'] },
    },
  }
}
