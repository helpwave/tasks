import type { InMemoryCacheConfig, Reference } from '@apollo/client/cache'

const propertyValueKeyFields = (object: Readonly<Record<string, unknown>>): readonly ['id'] | false => {
  const id = object?.['id']
  return id != null && id !== '' ? ['id'] : false
}

type ReadFieldFromReference = (fieldName: string, from: Reference) => unknown

const getReferenceIdentity = (readField: ReadFieldFromReference, reference: Reference): string => {
  const id = readField('id', reference)
  return typeof id === 'string' && id !== '' ? id : JSON.stringify(reference)
}

const mergeReferencesByIdentity = (
  existing: readonly Reference[] = [],
  incoming: readonly Reference[] = [],
  { readField }: { readField: ReadFieldFromReference }
): readonly Reference[] => {
  const incomingIdentities = new Set<string>()
  for (const reference of incoming) {
    incomingIdentities.add(getReferenceIdentity(readField, reference))
  }

  const mergedReferences = [...incoming]
  for (const reference of existing) {
    const identity = getReferenceIdentity(readField, reference)
    if (!incomingIdentities.has(identity)) {
      mergedReferences.push(reference)
    }
  }

  return mergedReferences
}

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
        },
      },
      Task: { keyFields: ['id'] },
      Patient: {
        keyFields: ['id'],
        fields: {
          properties: { merge: mergeReferencesByIdentity },
        },
      },
      PatientType: {
        keyFields: ['id'],
        fields: {
          properties: { merge: mergeReferencesByIdentity },
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
    },
  }
}
