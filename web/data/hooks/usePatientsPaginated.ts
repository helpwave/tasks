import { useCallback, useEffect, useState } from 'react'
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

export function usePatientsPaginated(
  variables: GetPatientsQueryVariables | undefined,
  options: UsePatientsPaginatedOptions
): UsePatientsPaginatedResult {
  const { pageSize } = options
  const [pageIndex, setPageIndex] = useState(0)
  const [pages, setPages] = useState<(GetPatientsQuery | undefined)[]>([])
  const variablesWithPagination: GetPatientsQueryVariables = {
    ...(variables ?? {}),
    pagination: { pageIndex, pageSize },
  }
  const result = useQueryWhenReady<GetPatientsQuery, GetPatientsQueryVariables>(
    GetPatientsDocument,
    variablesWithPagination
  )
  const totalCount = result.data?.patientsTotal

  useEffect(() => {
    if (!result.loading && result.data !== undefined) {
      setPages((prev) => {
        const next = [...prev]
        next[pageIndex] = result.data
        return next
      })
    }
  }, [result.loading, result.data, pageIndex])

  const flattenedPatients = pages.flatMap((p) => p?.patients ?? [])
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
