import type { ApolloCache, Reference } from '@apollo/client'
import type { MySavedViewsQuery } from '@/api/gql/generated'

type SavedViewRow = MySavedViewsQuery['mySavedViews'][number]

export function appendSavedViewToMySavedViewsCache(cache: ApolloCache, view: SavedViewRow): void {
  cache.modify({
    fields: {
      mySavedViews(existing: readonly Reference[] = [], { readField, toReference }) {
        if (existing.some((ref) => readField('id', ref) === view.id)) {
          return existing
        }
        const ref = toReference({ __typename: 'SavedView', id: view.id })
        return ref ? [...existing, ref] : existing
      },
    },
  })
}

export function replaceSavedViewInMySavedViewsCache(cache: ApolloCache, view: SavedViewRow): void {
  appendSavedViewToMySavedViewsCache(cache, view)
}

export function removeSavedViewFromMySavedViewsCache(cache: ApolloCache, id: string): void {
  cache.modify({
    fields: {
      mySavedViews(existing: readonly Reference[] = [], { readField }) {
        return existing.filter((ref) => readField('id', ref) !== id)
      },
    },
  })
}
