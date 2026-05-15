import type { PropertyValueInput } from '@/api/gql/generated'

export type MergeablePropertyValue = {
  definition: { id: string },
  textValue?: string | null,
  numberValue?: number | null,
  booleanValue?: boolean | null,
  dateValue?: string | null,
  dateTimeValue?: string | null,
  selectValue?: string | null,
  multiSelectValues?: string[] | null,
  userValue?: string | null,
}

function propertyToInput(prop: MergeablePropertyValue): PropertyValueInput {
  return {
    definitionId: prop.definition.id,
    textValue: prop.textValue ?? undefined,
    numberValue: prop.numberValue ?? undefined,
    booleanValue: prop.booleanValue ?? undefined,
    dateValue: prop.dateValue ?? undefined,
    dateTimeValue: prop.dateTimeValue ?? undefined,
    selectValue: prop.selectValue ?? undefined,
    multiSelectValues: prop.multiSelectValues ?? undefined,
    userValue: prop.userValue ?? undefined,
  }
}

export function mergePropertyChangeIntoInputs(
  currentProperties: MergeablePropertyValue[] | null | undefined,
  definitionId: string,
  change: PropertyValueInput | null
): PropertyValueInput[] {
  const propertyInputs: PropertyValueInput[] = []
  for (const prop of currentProperties ?? []) {
    if (prop.definition.id !== definitionId) {
      propertyInputs.push(propertyToInput(prop))
    }
  }
  if (change !== null) {
    propertyInputs.push(change)
  }
  return propertyInputs
}
