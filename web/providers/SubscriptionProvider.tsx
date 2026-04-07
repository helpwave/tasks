'use client'

import { type PropsWithChildren } from 'react'
import { useApolloClient } from '@apollo/client/react'
import { useApolloGlobalSubscriptions } from '@/data/subscriptions/useApolloGlobalSubscriptions'

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const client = useApolloClient()
  useApolloGlobalSubscriptions(client, undefined, {
    conflictStrategy: 'defer',
  })
  return <>{children}</>
}

