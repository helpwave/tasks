import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import type { DocumentNode } from 'graphql'
import { parse } from 'graphql'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'

const parsedCache = new Map<string, DocumentNode>()

export function getParsedDocument(document: string | DocumentNode): DocumentNode {
  if (typeof document !== 'string') {
    return document
  }
  let node = parsedCache.get(document)
  if (!node) {
    node = parse(document) as DocumentNode
    parsedCache.set(document, node)
  }
  return node
}

export type QueryResult<TData> = {
  data: TData | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useQueryWhenReady<TData, TVariables extends Record<string, unknown>>(
  document: string | DocumentNode,
  variables: TVariables,
  options?: { skip?: boolean, fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' }
): QueryResult<TData> {
  const client = useApolloClientOptional()
  const doc = useMemo(() => getParsedDocument(document), [document])
  const skip = options?.skip ?? !client
  const result = useQuery<TData, TVariables>(doc, {
    variables,
    skip,
    fetchPolicy: options?.fetchPolicy ?? 'cache-first',
  })
  return {
    data: result.data as TData | undefined,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  }
}
