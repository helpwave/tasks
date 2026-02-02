const taskIds = new Set<string>()
const patientIds = new Set<string>()
let version = 0
const listeners = new Set<() => void>()

function notify(): void {
  version += 1
  listeners.forEach((l) => l())
}

export function addRefreshingTask(id: string): void {
  taskIds.add(id)
  notify()
}

export function removeRefreshingTask(id: string): void {
  taskIds.delete(id)
  notify()
}

export function addRefreshingPatient(id: string): void {
  patientIds.add(id)
  notify()
}

export function removeRefreshingPatient(id: string): void {
  patientIds.delete(id)
  notify()
}

export function getRefreshingTaskIds(): ReadonlySet<string> {
  return taskIds
}

export function getRefreshingPatientIds(): ReadonlySet<string> {
  return patientIds
}

export function subscribeRefreshingEntities(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

let cachedSnapshot: { version: number, taskIds: ReadonlySet<string>, patientIds: ReadonlySet<string> } | null = null
let cachedVersion = -1

export function getRefreshingEntitiesSnapshot(): { version: number, taskIds: ReadonlySet<string>, patientIds: ReadonlySet<string> } {
  if (cachedSnapshot !== null && cachedVersion === version) {
    return cachedSnapshot
  }
  cachedVersion = version
  cachedSnapshot = { version, taskIds: new Set(taskIds), patientIds: new Set(patientIds) }
  return cachedSnapshot
}
