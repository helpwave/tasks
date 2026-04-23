import type { PropertyValueInput } from '@/api/gql/generated'

type PropertyValueLike = {
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

export function buildPropertyValueInputsExcludingDefinition(
  properties: readonly PropertyValueLike[] | null | undefined,
  excludedDefinitionId: string
): PropertyValueInput[] {
  const next: PropertyValueInput[] = []
  for (const property of properties ?? []) {
    if (property.definition.id === excludedDefinitionId) continue
    next.push({
      definitionId: property.definition.id,
      textValue: property.textValue ?? undefined,
      numberValue: property.numberValue ?? undefined,
      booleanValue: property.booleanValue ?? undefined,
      dateValue: property.dateValue ?? undefined,
      dateTimeValue: property.dateTimeValue ?? undefined,
      selectValue: property.selectValue ?? undefined,
      multiSelectValues: property.multiSelectValues ?? undefined,
      userValue: property.userValue ?? undefined,
    })
  }
  return next
}
