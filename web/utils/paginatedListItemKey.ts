type PropertyLike = {
  definition?: { id?: string | null } | null,
  textValue?: string | null,
  numberValue?: number | null,
  booleanValue?: boolean | null,
  dateValue?: string | null,
  dateTimeValue?: string | null,
  selectValue?: string | null,
  multiSelectValues?: string[] | null,
  userValue?: string | null,
}

type PaginatedListItemLike = {
  id: string,
  title?: string | null,
  name?: string | null,
  done?: boolean | null,
  updateDate?: string | null,
  firstname?: string | null,
  lastname?: string | null,
  birthdate?: string | null,
  sex?: string | null,
  state?: string | null,
  properties?: PropertyLike[] | null,
}

function serializeProperties(properties: PropertyLike[] | null | undefined): string {
  if (!properties?.length) return ''
  return properties
    .map((property) => {
      const definitionId = property.definition?.id ?? ''
      return [
        definitionId,
        property.textValue ?? '',
        property.numberValue ?? '',
        property.booleanValue ?? '',
        property.dateValue ?? '',
        property.dateTimeValue ?? '',
        property.selectValue ?? '',
        (property.multiSelectValues ?? []).join(','),
        property.userValue ?? '',
      ].join(':')
    })
    .sort()
    .join('|')
}

export function paginatedListItemKey(item: PaginatedListItemLike): string {
  return [
    item.id,
    item.title ?? '',
    item.name ?? '',
    item.firstname ?? '',
    item.lastname ?? '',
    item.birthdate ?? '',
    item.sex ?? '',
    item.state ?? '',
    item.done ?? '',
    item.updateDate ?? '',
    serializeProperties(item.properties),
  ].join('\0')
}

export function samePaginatedListItems<T extends { id: string }>(
  a: T[],
  b: T[],
  keyFn: (item: T) => string = paginatedListItemKey as (item: T) => string
): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.id !== b[i]!.id) return false
    if (keyFn(a[i]!) !== keyFn(b[i]!)) return false
  }
  return true
}
