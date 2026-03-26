import {
  GetPatientsDocument,
  type GetPatientsQuery,
  type GetPatientsQueryVariables
} from '@/api/gql/generated'
import type { QueryFilterClauseInput, QuerySortClauseInput, QuerySearchInput } from '@/api/gql/generated'
import { usePaginatedEntityQuery } from './usePaginatedEntityQuery'

export type UsePatientsPaginatedOptions = {
  pagination: { pageIndex: number, pageSize: number },
  sorts?: QuerySortClauseInput[],
  filters?: QueryFilterClauseInput[],
  search?: QuerySearchInput,
  skip?: boolean,
}

export type UsePatientsPaginatedResult = {
  data: GetPatientsQuery['patients'],
  loading: boolean,
  error: Error | undefined,
  totalCount: number | undefined,
  refetch: () => void,
}

function propertyFingerprint(prop: { definition?: { id: string }, textValue?: string | null, numberValue?: number | null, userValue?: string | null }): string {
  const defId = prop.definition?.id ?? ''
  const val = prop.userValue ?? prop.textValue ?? prop.numberValue ?? ''
  return `${defId}:${String(val)}`
}

function getPageDataKey(data: GetPatientsQuery | undefined): string {
  if (!data?.patients?.length) return ''
  return data.patients.map(p =>
    `${p.id}[${(p.properties ?? []).map(propertyFingerprint).join(';')}]`).join('|')
}

export function usePatientsPaginated(
  variables: GetPatientsQueryVariables | undefined,
  options: UsePatientsPaginatedOptions
): UsePatientsPaginatedResult {
  return usePaginatedEntityQuery<
    GetPatientsQuery,
    GetPatientsQueryVariables,
    GetPatientsQuery['patients'][0]
  >(
    GetPatientsDocument,
    variables,
    {
      pagination: options.pagination,
      sorts: options.sorts,
      filters: options.filters,
      search: options.search,
      getPageDataKey,
      skip: options.skip,
    },
    (data) => data?.patients ?? [],
    (data) => data?.patientsTotal
  )
}
