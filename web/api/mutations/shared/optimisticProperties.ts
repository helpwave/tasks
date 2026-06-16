import type { ApolloCache } from '@apollo/client/cache'
import type { DocumentNode } from 'graphql'
import { parse } from 'graphql'
import type { PropertyValueInput } from '@/api/gql/generated'

/**
 * Shared helpers for building the optimistic `properties` array of an entity
 * (Patient / Task) during an inline property edit.
 *
 * The important detail is that we must read the entity's *currently cached*
 * properties from the normalized entity (e.g. `PatientType:<uuid>`) instead of
 * from the entity's detail query (e.g. `GetPatient`). When a property is edited
 * directly from a list (the common case), the detail query was never run, so
 * reading it returns `null`. The previous implementation treated that as "no
 * existing properties" and therefore re-created *every* property with a
 * synthetic `attachment-*` id, throwing away the real backend uuids. Once the
 * server responded with the real uuids, the cache merge could no longer match
 * the optimistic entries to the server entries, leaving duplicated / stale
 * cells until a full reload.
 *
 * Reading the normalized entity preserves the real property uuids so the
 * optimistic update merges cleanly with the eventual server response.
 */

export type OptimisticPropertyValue = {
  __typename: 'PropertyValueType',
  id?: string,
  definition: unknown,
  textValue?: string | null,
  numberValue?: number | null,
  booleanValue?: boolean | null,
  dateValue?: string | null,
  dateTimeValue?: string | null,
  selectValue?: string | null,
  multiSelectValues?: string[] | null,
  userValue?: string | null,
}

const fragmentCache = new Map<string, { document: DocumentNode, name: string }>()

function getPropertiesFragment(typename: string): { document: DocumentNode, name: string } {
  const cached = fragmentCache.get(typename)
  if (cached) return cached
  const name = `OptimisticEntityProperties_${typename}`
  const document = parse(`
    fragment ${name} on ${typename} {
      id
      properties {
        id
        definition { id }
        textValue
        numberValue
        booleanValue
        dateValue
        dateTimeValue
        selectValue
        multiSelectValues
        userValue
        user { id }
        team { id }
      }
    }
  `) as DocumentNode
  const entry = { document, name }
  fragmentCache.set(typename, entry)
  return entry
}

/**
 * Reads the entity's currently cached property values (with their real uuids)
 * directly from the normalized cache entity. Returns `[]` when the entity is
 * not (yet) in the cache.
 */
export function readEntityProperties(
  cache: ApolloCache,
  typename: string,
  id: string
): OptimisticPropertyValue[] {
  const entityId = cache.identify({ __typename: typename, id })
  if (!entityId) return []
  const fragment = getPropertiesFragment(typename)
  try {
    const data = cache.readFragment<{ properties?: OptimisticPropertyValue[] }>({
      id: entityId,
      fragment: fragment.document,
      fragmentName: fragment.name,
    })
    return data?.properties ?? []
  } catch {
    return []
  }
}

function getDefinitionId(definition: unknown): string | undefined {
  if (definition && typeof definition === 'object' && 'id' in definition) {
    const id = (definition as { id?: unknown }).id
    return typeof id === 'string' ? id : undefined
  }
  return undefined
}

/**
 * Builds the optimistic `properties` array for an entity from the existing
 * cached properties and the mutation inputs. The mutation inputs already
 * contain the full set of property values for the entity (see
 * `mergePropertyChangeIntoInputs`), so the result mirrors that set while
 * preserving the real uuid of every property that already existed.
 */
export function buildOptimisticProperties(
  existingProps: OptimisticPropertyValue[],
  inputs: PropertyValueInput[] | null | undefined,
  entityId: string
): OptimisticPropertyValue[] {
  if (!inputs) return existingProps
  return inputs.map((inp): OptimisticPropertyValue => {
    const existing = existingProps.find(
      (p) => getDefinitionId(p.definition) === inp.definitionId
    )
    const scalars = {
      textValue: inp.textValue ?? null,
      numberValue: inp.numberValue ?? null,
      booleanValue: inp.booleanValue ?? null,
      dateValue: inp.dateValue ?? null,
      dateTimeValue: inp.dateTimeValue ?? null,
      selectValue: inp.selectValue ?? null,
      multiSelectValues: inp.multiSelectValues ?? null,
      userValue: inp.userValue ?? null,
    }
    if (existing) {
      // Preserve the real uuid (and any nested user/team refs) of the property
      // that already exists; only the scalar value changes.
      return { ...existing, ...scalars }
    }
    return {
      __typename: 'PropertyValueType',
      id: `attachment-${entityId}-${inp.definitionId}`,
      definition: { __ref: `PropertyDefinitionType:${inp.definitionId}` },
      ...scalars,
    }
  })
}

function isPersistedPropertyId(id: string | undefined): id is string {
  return id != null && id !== '' && !id.startsWith('attachment-')
}

export function getNewOptimisticProperties(
  properties: OptimisticPropertyValue[]
): OptimisticPropertyValue[] {
  return properties.filter((property) => !isPersistedPropertyId(property.id))
}

export function applyOptimisticPropertyScalars(
  cache: ApolloCache,
  properties: OptimisticPropertyValue[]
): void {
  for (const property of properties) {
    if (!isPersistedPropertyId(property.id)) continue
    const propertyId = cache.identify({
      __typename: 'PropertyValueType',
      id: property.id,
    })
    if (!propertyId) continue
    cache.modify({
      id: propertyId,
      fields: {
        textValue: () => property.textValue ?? null,
        numberValue: () => property.numberValue ?? null,
        booleanValue: () => property.booleanValue ?? null,
        dateValue: () => property.dateValue ?? null,
        dateTimeValue: () => property.dateTimeValue ?? null,
        selectValue: () => property.selectValue ?? null,
        multiSelectValues: () => property.multiSelectValues ?? null,
        userValue: () => property.userValue ?? null,
      },
    })
  }
}
