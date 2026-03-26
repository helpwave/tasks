import { useApolloClient, useQuery } from '@apollo/client/react'
import { useEffect, useMemo } from 'react'
import {
  MySavedViewsDocument,
  SavedViewDocument,
  type MySavedViewsQuery,
  type MySavedViewsQueryVariables,
  type SavedViewQuery,
  type SavedViewQueryVariables
} from '@/api/gql/generated'
import { schedulePersistCache } from '../cache/persist'
import { getParsedDocument, useQueryWhenReady } from './queryHelpers'

type MySavedViewsHookOptions = {
  skip?: boolean,
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only',
}

export function useMySavedViews(options?: MySavedViewsHookOptions) {
  const client = useApolloClient()
  const doc = useMemo(() => getParsedDocument(MySavedViewsDocument), [])
  const result = useQuery<MySavedViewsQuery, MySavedViewsQueryVariables>(doc, {
    variables: {},
    skip: options?.skip,
    fetchPolicy: options?.fetchPolicy ?? 'cache-first',
  })
  useEffect(() => {
    if (!result.data?.mySavedViews || typeof window === 'undefined') return
    schedulePersistCache(client.cache)
  }, [result.data, client])
  return {
    data: result.data,
    loading: result.loading,
    error: result.error as Error | undefined,
    refetch: result.refetch,
  }
}

export function useSavedView(id: string | undefined, options?: { skip?: boolean }) {
  return useQueryWhenReady<SavedViewQuery, SavedViewQueryVariables>(
    SavedViewDocument,
    { id: id ?? '' },
    { skip: options?.skip ?? !id }
  )
}
