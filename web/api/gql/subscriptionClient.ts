import { getConfig } from '@/utils/config'
import { getUser } from '@/api/auth/authService'

export type SubscriptionObserver = {
  next: (value: unknown) => void
  error: (error: Error) => void
  complete: () => void
}

type GraphQLWSMessage = {
  id?: string
  type: 'connection_init' | 'start' | 'stop' | 'connection_ack' | 'data' | 'error' | 'complete' | 'ka'
  payload?: unknown
}

class GraphQLSubscriptionClient {
  private ws: WebSocket | null = null
  private subscriptions = new Map<string, SubscriptionObserver>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private isConnecting = false
  private messageIdCounter = 0
  private keepAliveInterval: NodeJS.Timeout | null = null
  private connectionPromise: Promise<WebSocket> | null = null

  private async connect(): Promise<WebSocket> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this._connect()
    try {
      const ws = await this.connectionPromise
      return ws
    } finally {
      this.connectionPromise = null
    }
  }

  private async _connect(): Promise<WebSocket> {
    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection)
            resolve(this.ws!)
          } else if (this.ws?.readyState === WebSocket.CLOSED && !this.isConnecting) {
            clearInterval(checkConnection)
            reject(new Error('Connection failed'))
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkConnection)
          reject(new Error('Connection timeout'))
        }, 10000)
      })
    }

    this.isConnecting = true

    try {
      const config = getConfig()
      const wsUrl = config.graphqlEndpoint.replace(/^http/, 'ws').replace(/^https/, 'wss')
      const user = await getUser()
      const token = user?.access_token

      const url = token
        ? `${wsUrl}?token=${encodeURIComponent(token)}`
        : wsUrl

      const ws = new WebSocket(url, 'graphql-ws')

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'))
        }, 10000)

        ws.onopen = () => {
          clearTimeout(timeout)
          this.isConnecting = false
          this.reconnectAttempts = 0
          
          const initMessage: GraphQLWSMessage = {
            type: 'connection_init',
            payload: token ? { authorization: `Bearer ${token}` } : {},
          }
          ws.send(JSON.stringify(initMessage))

          this.startKeepAlive()
          resolve(ws)
        }

        ws.onerror = (error) => {
          clearTimeout(timeout)
          this.isConnecting = false
          
          reject(error)
        }

        ws.onclose = (event) => {
          clearTimeout(timeout)
          this.isConnecting = false
          this.ws = null
          this.stopKeepAlive()

          if (event.code !== 1000 && this.subscriptions.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => {
              this.connect().catch(() => {})
            }, this.reconnectDelay * Math.min(this.reconnectAttempts, 5))
          }
        }

        ws.onmessage = (event) => {
          try {
            const message: GraphQLWSMessage = JSON.parse(event.data)
            
            if (message.type === 'connection_ack') {
              return
            }

            if (message.type === 'ka') {
              return
            }
            
            if (message.id) {
              const observer = this.subscriptions.get(message.id)
              
              if (observer) {
                if (message.type === 'data') {
                  observer.next(message.payload)
                } else if (message.type === 'error') {
                  observer.error(new Error(String(message.payload)))
                } else if (message.type === 'complete') {
                  observer.complete()
                  this.subscriptions.delete(message.id)
                }
              }
            }
          } catch (error) {
            
          }
        }

        this.ws = ws
      })
    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  private startKeepAlive() {
    this.stopKeepAlive()
    this.keepAliveInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ka' }))
      }
    }, 30000)
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }
  }

  async subscribe(
    query: string,
    variables: Record<string, unknown> | undefined,
    observer: SubscriptionObserver
  ): Promise<() => void> {
    let ws: WebSocket
    try {
      ws = await this.connect()
    } catch (error) {
      
      observer.error(error as Error)
      return () => {}
    }

    const subscriptionId = `sub_${++this.messageIdCounter}`

    this.subscriptions.set(subscriptionId, observer)

    const sendStart = () => {
      if (ws.readyState !== WebSocket.OPEN) {
        return
      }
      const startMessage: GraphQLWSMessage = {
        id: subscriptionId,
        type: 'start',
        payload: {
          query,
          variables: variables || {},
        },
      }
      try {
        ws.send(JSON.stringify(startMessage))
      } catch (error) {
        
        observer.error(error as Error)
      }
    }

    if (ws.readyState === WebSocket.OPEN) {
      sendStart()
    } else {
      ws.addEventListener('open', sendStart, { once: true })
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        const stopMessage: GraphQLWSMessage = {
          id: subscriptionId,
          type: 'stop',
        }
        try {
          ws.send(JSON.stringify(stopMessage))
        } catch (error) {
          
        }
      }
      this.subscriptions.delete(subscriptionId)
    }
  }
}

export const subscriptionClient = new GraphQLSubscriptionClient()
