import type { PendingMutationRecord } from '../mutations/types'
import type { NormalizedCacheObject } from '@apollo/client/cache'

const DB_NAME = 'tasks-apollo-db'
const DB_VERSION = 1
const PENDING_STORE = 'pending_mutations'
const CACHE_STORE = 'cache_snapshot'
const CACHE_KEY = 'apollo_cache'

function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not available'))
  }
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: 'clientMutationId' })
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE)
      }
    }
  })
}

export async function addPendingMutation(record: PendingMutationRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_STORE)
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function removePendingMutation(clientMutationId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_STORE)
    const request = store.delete(clientMutationId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getPendingMutations(): Promise<PendingMutationRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readonly')
    const store = tx.objectStore(PENDING_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result ?? [])
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function setCacheSnapshot(snapshot: NormalizedCacheObject): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readwrite')
    const store = tx.objectStore(CACHE_STORE)
    const request = store.put(snapshot, CACHE_KEY)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getCacheSnapshot(): Promise<NormalizedCacheObject | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readonly')
    const store = tx.objectStore(CACHE_STORE)
    const request = store.get(CACHE_KEY)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}
