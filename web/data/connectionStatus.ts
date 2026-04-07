export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

let status: ConnectionStatus = 'disconnected'
const listeners = new Set<() => void>()

export function setConnectionStatus(next: ConnectionStatus): void {
  if (status === next) return
  status = next
  listeners.forEach((l) => l())
}

export function getConnectionStatus(): ConnectionStatus {
  return status
}

export function subscribeConnectionStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
