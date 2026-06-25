import type { InMemoryCacheConfig, Reference } from '@apollo/client/cache'

const propertyValueKeyFields = (object: Readonly<Record<string, unknown>>): readonly ['id'] | false => {
  const id = object?.['id']
  return id != null && id !== '' ? ['id'] : false
}

// An entity's `properties` array is always returned in full by every query that
// selects it (GetPatients, GetPatient, GetTasks, GetTask, GetOverviewData), so
// the canonical server response is authoritative. Replacing (rather than
// unioning) the array lets an edit that removes a property — e.g. clearing a
// select value — actually take effect; a union merge would re-add the removed
// property from the previous cache value and the change would silently revert
// after the post-mutation refetch.
const replaceProperties = (_existing: readonly Reference[] | undefined, incoming: readonly Reference[]): readonly Reference[] => incoming

export function buildCacheConfig(): InMemoryCacheConfig {
  return {
    typePolicies: {
      Query: {
        fields: {
          task: { keyArgs: ['id'] },
          tasks: {
            keyArgs: ['rootLocationIds', 'assigneeId', 'assigneeTeamId', 'filters', 'sorts', 'search', 'pagination'],
          },
          patient: { keyArgs: ['id'] },
          patients: {
            keyArgs: ['locationId', 'rootLocationIds', 'states', 'filters', 'sorts', 'search', 'pagination'],
            merge: (_existing, incoming) => incoming,
          },
          locationNode: { keyArgs: ['id'] },
          locationNodes: {
            keyArgs: ['limit', 'offset', 'kind'],
            merge: (_existing, incoming) => incoming,
          },
          users: { keyArgs: [] },
          me: { keyArgs: [] },
          taskPresets: {
            merge: (_existing, incoming) => incoming,
          },
          taskPreset: { keyArgs: ['id'] },
        },
      },
      Task: {
        keyFields: ['id'],
        fields: {
          properties: { merge: replaceProperties },
        },
      },
      TaskType: {
        keyFields: ['id'],
        fields: {
          properties: { merge: replaceProperties },
        },
      },
      Patient: {
        keyFields: ['id'],
        fields: {
          properties: { merge: replaceProperties },
        },
      },
      PatientType: {
        keyFields: ['id'],
        fields: {
          properties: { merge: replaceProperties },
        },
      },
      User: { keyFields: ['id'] },
      UserType: {
        keyFields: ['id'],
        fields: {
          tasks: {
            keyArgs: ['rootLocationIds'],
            merge: (_existing, incoming) => incoming,
          },
        },
      },
      LocationNode: { keyFields: ['id'] },
      LocationNodeType: { keyFields: ['id'] },
      PropertyValue: { keyFields: propertyValueKeyFields },
      PropertyValueType: { keyFields: propertyValueKeyFields },
      PropertyDefinitionType: { keyFields: ['id'] },
      TaskGraphType: { keyFields: false },
      TaskGraphNodeType: { keyFields: false },
      TaskGraphEdgeType: { keyFields: false },
      TaskPresetType: { keyFields: ['id'] },
    },
  }
}
