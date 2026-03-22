import {
  MySavedViewsDocument,
  SavedViewDocument,
  type MySavedViewsQuery,
  type MySavedViewsQueryVariables,
  type SavedViewQuery,
  type SavedViewQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export function useMySavedViews(options?: { skip?: boolean }) {
  return useQueryWhenReady<MySavedViewsQuery, MySavedViewsQueryVariables>(
    MySavedViewsDocument,
    {},
    options
  )
}

export function useSavedView(id: string | undefined, options?: { skip?: boolean }) {
  return useQueryWhenReady<SavedViewQuery, SavedViewQueryVariables>(
    SavedViewDocument,
    { id: id ?? '' },
    { skip: options?.skip ?? !id }
  )
}
