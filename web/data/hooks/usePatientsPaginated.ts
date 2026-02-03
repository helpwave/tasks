import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GetPatientsDocument,
  type GetPatientsQuery,
  type GetPatientsQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UsePatientsPaginatedOptions = {
  pageSize: number,
}

export type UsePatientsPaginatedResult = {
  data: GetPatientsQuery['patients'],
  loading: boolean,
  error: Error | undefined,
  fetchNextPage: () => void,
  hasNextPage: boolean,
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
  const { pageSize } = options
  const [pageIndex, setPageIndex] = useState(0)
  const [pages, setPages] = useState<(GetPatientsQuery | undefined)[]>([])
  const variablesWithPagination: GetPatientsQueryVariables = useMemo(() => ({
    ...(variables ?? {}),
    pagination: { pageIndex, pageSize },
  }), [variables, pageIndex, pageSize])
  const variablesKey = useMemo(
    () => JSON.stringify(variablesWithPagination),
    [variablesWithPagination]
  )
  const result = useQueryWhenReady<GetPatientsQuery, GetPatientsQueryVariables>(
    GetPatientsDocument,
    variablesWithPagination,
    { fetchPolicy: 'cache-and-network' }
  )
  const totalCount = result.data?.patientsTotal
  const prevDataKeyRef = useRef<string>('')
  const variablesKeyRef = useRef<string>('')

  useEffect(() => {
    if (variablesKey !== variablesKeyRef.current) {
      variablesKeyRef.current = variablesKey
      prevDataKeyRef.current = ''
    }
    if (result.loading || result.data === undefined) return
    const dataKey = getPageDataKey(result.data)
    if (prevDataKeyRef.current === dataKey) return
    prevDataKeyRef.current = dataKey
    setPages((prev) => {
      const next = [...prev]
      next[pageIndex] = result.data
      return next
    })
  }, [result.loading, result.data, pageIndex, variablesKey])

  const flattenedPatients = useMemo(() => {
    const currentFromCache = !result.loading ? result.data?.patients : undefined
    const before = pages.slice(0, pageIndex).flatMap((p) => p?.patients ?? [])
    const current = currentFromCache ?? pages[pageIndex]?.patients ?? []
    const after = pages.slice(pageIndex + 1).flatMap((p) => p?.patients ?? [])
    return [...before, ...current, ...after]
  }, [pageIndex, pages, result.data?.patients, result.loading])

  const hasNextPage =
    (totalCount !== undefined && flattenedPatients.length < totalCount) ?? false

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !result.loading) {
      setPageIndex((i) => i + 1)
    }
  }, [hasNextPage, result.loading])

  const refetch = useCallback(() => {
    result.refetch()
  }, [result])

  return {
    data: flattenedPatients,
    loading: result.loading,
    error: result.error,
    fetchNextPage,
    hasNextPage,
    totalCount,
    refetch,
  }
}
