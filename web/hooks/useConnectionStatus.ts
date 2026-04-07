import { useSyncExternalStore } from 'react'
import {
  subscribeConnectionStatus,
  getConnectionStatus
} from '@/data/connectionStatus'

const emptyStatus = 'disconnected' as const

function getServerSnapshot(): 'connecting' | 'connected' | 'disconnected' {
  return emptyStatus
}

export function useConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
  return useSyncExternalStore(
    subscribeConnectionStatus,
    getConnectionStatus,
    getServerSnapshot
  )
}
