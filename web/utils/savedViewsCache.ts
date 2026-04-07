import type { ApolloCache } from '@apollo/client'
import { MySavedViewsDocument, type MySavedViewsQuery } from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'

type SavedViewRow = MySavedViewsQuery['mySavedViews'][number]

const mySavedViewsQuery = { query: getParsedDocument(MySavedViewsDocument) }

export function appendSavedViewToMySavedViewsCache(cache: ApolloCache, view: SavedViewRow): void {
  cache.updateQuery<MySavedViewsQuery>(mySavedViewsQuery, (data) => {
    if (!data) {
      return data
    }
    if (data.mySavedViews.some((v) => v.id === view.id)) {
      return data
    }
    return { ...data, mySavedViews: [...data.mySavedViews, view] }
  })
}

export function replaceSavedViewInMySavedViewsCache(cache: ApolloCache, view: SavedViewRow): void {
  cache.updateQuery<MySavedViewsQuery>(mySavedViewsQuery, (data) => {
    if (!data) {
      return data
    }
    const idx = data.mySavedViews.findIndex((v) => v.id === view.id)
    if (idx === -1) {
      return { ...data, mySavedViews: [...data.mySavedViews, view] }
    }
    const next = [...data.mySavedViews]
    next[idx] = view
    return { ...data, mySavedViews: next }
  })
}

export function removeSavedViewFromMySavedViewsCache(cache: ApolloCache, id: string): void {
  cache.updateQuery<MySavedViewsQuery>(mySavedViewsQuery, (data) => {
    if (!data) {
      return data
    }
    return { ...data, mySavedViews: data.mySavedViews.filter((v) => v.id !== id) }
  })
}
