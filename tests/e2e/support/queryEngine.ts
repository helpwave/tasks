/**
 * In-memory re-implementation of the backend query engine semantics
 * (backend/api/query/*) so the e2e mock backend can honour the `filters`,
 * `sorts` and `search` GraphQL arguments the web app sends.
 *
 * The semantics here intentionally mirror the SQLAlchemy adapters:
 *  - `apply_ops_to_column` (field_ops.py) for operator behaviour
 *  - `apply_patient_*` / `apply_task_*` (adapters/patient.py, adapters/task.py)
 *    for which field keys resolve to which values
 * so that a test passing against this mock describes the behaviour the real
 * backend implements.
 */

export type FilterValue = {
  stringValue?: string | null,
  stringValues?: string[] | null,
  floatValue?: number | null,
  floatMin?: number | null,
  floatMax?: number | null,
  boolValue?: boolean | null,
  dateValue?: string | null,
  dateMin?: string | null,
  dateMax?: string | null,
  uuidValue?: string | null,
  uuidValues?: string[] | null,
}

export type FilterClause = {
  fieldKey: string,
  operator: string,
  value?: FilterValue | null,
}

export type SortClause = {
  fieldKey: string,
  direction: 'ASC' | 'DESC',
}

export type SearchInput = {
  searchText?: string | null,
  includeProperties?: boolean | null,
}

// ---------------------------------------------------------------------------
// operator application (mirrors field_ops.apply_ops_to_column)
// ---------------------------------------------------------------------------

type Comparable = string | number | boolean | null | undefined

function ilike(haystack: Comparable, needle: string, mode: 'contains' | 'starts' | 'ends'): boolean {
  if (haystack == null) return false
  const h = String(haystack).toLowerCase()
  const n = needle.toLowerCase()
  if (mode === 'contains') return h.includes(n)
  if (mode === 'starts') return h.startsWith(n)
  return h.endsWith(n)
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10)
}

/**
 * Apply a query operator to a scalar value.
 * `kind` mirrors the `as_date` / `as_datetime` flags of the backend.
 */
export function applyOp(
  raw: Comparable,
  operator: string,
  value: FilterValue | null | undefined,
  kind: 'string' | 'number' | 'boolean' | 'date' | 'datetime' = 'string'
): boolean {
  if (operator === 'IS_NULL') return raw == null
  if (operator === 'IS_NOT_NULL') return raw != null
  if (value == null) return true // no condition -> row passes (backend adds no WHERE)

  if (kind === 'date' || kind === 'datetime') {
    // "not between" keeps rows without a value (mirrors the backend)
    if (raw == null) return operator === 'NOT_BETWEEN'
    const rawIso = String(raw)
    const rawCmp = kind === 'date' ? dateOnly(rawIso) : rawIso
    if (operator === 'BETWEEN' && value.dateMin && value.dateMax) {
      const d = dateOnly(rawIso)
      return d >= dateOnly(value.dateMin) && d <= dateOnly(value.dateMax)
    }
    if (operator === 'NOT_BETWEEN' && value.dateMin && value.dateMax) {
      const d = dateOnly(rawIso)
      return d < dateOnly(value.dateMin) || d > dateOnly(value.dateMax)
    }
    if (!value.dateValue) return true
    const cmp = kind === 'date' ? dateOnly(value.dateValue) : value.dateValue
    // datetime comparisons compare instants, date comparisons calendar days
    const a = kind === 'date' ? rawCmp : new Date(rawIso).getTime()
    const b = kind === 'date' ? cmp : new Date(cmp).getTime()
    switch (operator) {
    case 'EQ': return a === b
    case 'NEQ': return a !== b
    case 'GT': return a > b
    case 'GTE': return a >= b
    case 'LT': return a < b
    case 'LTE': return a <= b
    default: return true
    }
  }

  switch (operator) {
  case 'EQ': {
    if (value.uuidValue != null) return raw === value.uuidValue
    if (value.stringValue != null) return raw === value.stringValue
    if (value.floatValue != null) return raw === value.floatValue
    if (value.boolValue != null) return raw === value.boolValue
    return true
  }
  case 'NEQ': {
    if (value.uuidValue != null) return raw !== value.uuidValue
    if (value.stringValue != null) return raw !== value.stringValue
    if (value.floatValue != null) return raw !== value.floatValue
    if (value.boolValue != null) return raw !== value.boolValue
    return true
  }
  case 'GT': return cmpNumeric(raw, value, (a, b) => a > b)
  case 'GTE': return cmpNumeric(raw, value, (a, b) => a >= b)
  case 'LT': return cmpNumeric(raw, value, (a, b) => a < b)
  case 'LTE': return cmpNumeric(raw, value, (a, b) => a <= b)
  case 'BETWEEN': {
    if (value.floatMin != null && value.floatMax != null && typeof raw === 'number') {
      return raw >= value.floatMin && raw <= value.floatMax
    }
    return true
  }
  case 'NOT_BETWEEN': {
    if (value.floatMin != null && value.floatMax != null) {
      if (typeof raw !== 'number') return true // no value -> kept (backend parity)
      return raw < value.floatMin || raw > value.floatMax
    }
    return true
  }
  case 'IN': {
    const list = value.stringValues?.length ? value.stringValues : value.uuidValues
    if (!list?.length) return true
    return raw != null && list.includes(String(raw))
  }
  case 'NOT_IN': {
    const list = value.stringValues?.length ? value.stringValues : value.uuidValues
    if (!list?.length) return true
    return raw == null || !list.includes(String(raw))
  }
  case 'CONTAINS': {
    if (value.stringValue == null) return true
    return ilike(raw, value.stringValue, 'contains')
  }
  case 'NOT_CONTAINS': {
    // keeps rows without a value (mirrors the backend)
    if (value.stringValue == null) return true
    return raw == null || !ilike(raw, value.stringValue, 'contains')
  }
  case 'STARTS_WITH': {
    if (value.stringValue == null) return true
    return ilike(raw, value.stringValue, 'starts')
  }
  case 'ENDS_WITH': {
    if (value.stringValue == null) return true
    return ilike(raw, value.stringValue, 'ends')
  }
  default:
    return true
  }
}

function cmpNumeric(raw: Comparable, value: FilterValue, pred: (a: number, b: number) => boolean): boolean {
  if (value.floatValue != null) {
    if (typeof raw !== 'number') return false
    return pred(raw, value.floatValue)
  }
  return true
}

// ---------------------------------------------------------------------------
// generic ordering helpers
// ---------------------------------------------------------------------------

export type SortAccessor<T> = (row: T) => string | number | null | undefined

/**
 * Order rows like the backend: per sort clause `asc().nulls_first()` /
 * `desc().nulls_last()`, with a stable `id asc` tiebreak.
 */
export function orderBy<T extends { id: string }>(
  rows: T[],
  sorts: SortClause[] | null | undefined,
  accessors: Record<string, SortAccessor<T>>
): T[] {
  const applicable = (sorts ?? []).filter(s => accessors[s.fieldKey])
  const copy = [...rows]
  copy.sort((a, b) => {
    for (const s of applicable) {
      const acc = accessors[s.fieldKey]!
      const av = acc(a)
      const bv = acc(b)
      const desc = s.direction === 'DESC'
      if (av == null && bv == null) continue
      // asc: nulls first, desc: nulls last (mirrors the SQLAlchemy adapters)
      if (av == null) return desc ? 1 : -1
      if (bv == null) return desc ? -1 : 1
      let c = 0
      if (typeof av === 'number' && typeof bv === 'number') c = av - bv
      else c = String(av).localeCompare(String(bv), 'en')
      if (c !== 0) return desc ? -c : c
    }
    return a.id.localeCompare(b.id, 'en')
  })
  return copy
}

export function paginate<T>(rows: T[], pagination?: { pageIndex?: number, pageSize?: number } | null): T[] {
  if (!pagination || typeof pagination.pageSize !== 'number' || pagination.pageSize <= 0) return rows
  const pageIndex = typeof pagination.pageIndex === 'number' ? pagination.pageIndex : 0
  const start = pageIndex * pagination.pageSize
  return rows.slice(start, start + pagination.pageSize)
}
