import { useSyncExternalStore } from 'react'
import {
  subscribeRefreshingEntities,
  getRefreshingEntitiesSnapshot
} from './refreshingEntities'

const emptySnapshot = { taskIds: new Set<string>() as ReadonlySet<string>, patientIds: new Set<string>() as ReadonlySet<string> }

function getServerSnapshot(): { taskIds: ReadonlySet<string>, patientIds: ReadonlySet<string> } {
  return emptySnapshot
}

export function useRefreshingEntityIds(): {
  refreshingTaskIds: ReadonlySet<string>,
  refreshingPatientIds: ReadonlySet<string>,
  } {
  const snapshot = useSyncExternalStore(
    subscribeRefreshingEntities,
    getRefreshingEntitiesSnapshot,
    getServerSnapshot
  )
  return { refreshingTaskIds: snapshot.taskIds, refreshingPatientIds: snapshot.patientIds }
}
