import {
  MySavedViewsDocument,
  SavedViewDocument,
  type MySavedViewsQuery,
  type MySavedViewsQueryVariables,
  type SavedViewQuery,
  type SavedViewQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

type MySavedViewsHookOptions = {
  skip?: boolean,
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only',
}

export function useMySavedViews(options?: MySavedViewsHookOptions) {
  return useQueryWhenReady<MySavedViewsQuery, MySavedViewsQueryVariables>(
    MySavedViewsDocument,
    {},
    {
      skip: options?.skip,
      fetchPolicy: options?.fetchPolicy ?? 'cache-and-network',
    }
  )
}

export function useSavedView(id: string | undefined, options?: { skip?: boolean }) {
  return useQueryWhenReady<SavedViewQuery, SavedViewQueryVariables>(
    SavedViewDocument,
    { id: id ?? '' },
    { skip: options?.skip ?? !id }
  )
}
