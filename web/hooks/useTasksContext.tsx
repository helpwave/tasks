import type { Dispatch, SetStateAction } from 'react'
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { HelpwaveLogo } from '@helpwave/hightide'
import { useGlobalData, useLocations } from '@/data'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useStorage } from './useStorage'
import { useConnectionStatus } from './useConnectionStatus'

function filterLocationsByRootSubtree(
  locations: Array<{ id: string, title: string, parentId?: string | null }>,
  selectedRootLocationIds: string[],
  rootLocations: Array<{ id: string, title: string, kind?: string }>,
  allLocations?: Array<{ id: string, title: string, parentId?: string | null }>
): Array<{ id: string, title: string, kind?: string }> {
  if (!selectedRootLocationIds || selectedRootLocationIds.length === 0) {
    return locations.map(loc => ({ id: loc.id, title: loc.title }))
  }

  if (!allLocations || allLocations.length === 0) {
    return locations.map(loc => ({ id: loc.id, title: loc.title }))
  }

  const rootLocationSet = new Set(selectedRootLocationIds)
  const allLocationsMap = new Map<string, { id: string, title: string, parentId?: string | null }>()

  allLocations.forEach(loc => allLocationsMap.set(loc.id, loc))
  locations.forEach(loc => allLocationsMap.set(loc.id, loc))
  rootLocations.forEach(loc => allLocationsMap.set(loc.id, { id: loc.id, title: loc.title, parentId: null }))

  const isDescendantOfRoot = (locationId: string): boolean => {
    if (rootLocationSet.has(locationId)) {
      return true
    }

    let current = allLocationsMap.get(locationId)
    const visited = new Set<string>()

    while (current?.parentId && !visited.has(current.id)) {
      visited.add(current.id)
      if (rootLocationSet.has(current.parentId)) {
        return true
      }
      current = allLocationsMap.get(current.parentId)
    }

    return false
  }

  return locations
    .filter(loc => isDescendantOfRoot(loc.id))
    .map(loc => ({ id: loc.id, title: loc.title }))
}

const ROOT_LOCATION_KINDS = new Set<string>(['HOSPITAL', 'PRACTICE', 'CLINIC', 'TEAM', 'WARD'])

function isAllowedRootKind(kind: string | undefined): boolean {
  if (!kind) return false
  return ROOT_LOCATION_KINDS.has(kind.toString().toUpperCase())
}

type User = {
  id: string,
  name: string,
  avatarUrl?: string | null,
  organizations?: string | null,
  isOnline?: boolean | null,
}

type LocationNode = {
  id: string,
  title: string,
  kind?: string,
}

type SidebarContextType = {
  isShowingTeams: boolean,
  isShowingWards: boolean,
  isShowingClinics: boolean,
  isShowingSavedViews: boolean,
}

export type TasksContextState = {
  myTasksCount?: number,
  scopedPatientsTotal?: number,
  scopedPatientsWaiting?: number,
  scopedPatientsAdmitted?: number,
  scopedPatientsDischarged?: number,
  scopedPatientsDeceased?: number,
  teams?: LocationNode[],
  wards?: LocationNode[],
  clinics?: LocationNode[],
  selectedLocationId?: string,
  selectedRootLocationIds?: string[],
  sidebar: SidebarContextType,
  user?: User,
  rootLocations?: LocationNode[],
  isRootLocationReinitializing?: boolean,
}

export type TasksContextType = TasksContextState & {
  route: string,
  update: Dispatch<SetStateAction<TasksContextState>>,
  isRootLocationPickerOpen: boolean,
  setRootLocationPickerOpen: Dispatch<SetStateAction<boolean>>,
}

const TasksContext = createContext<TasksContextType | null>(null)

export const useTasksContext = (): TasksContextType => {
  const context = useContext(TasksContext)

  if (!context) {
    throw new Error('useTasksContext must be used within a TasksContextProvider')
  }
  return context
}

export const TasksContextProvider = ({ children }: PropsWithChildren) => {
  const pathName = usePathname() ?? ''
  const { identity, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()
  const {
    value: storedSelectedRootLocationIdsRaw,
    setValue: setStoredSelectedRootLocationIds
  } = useStorage<string[]>({ key: 'selected-root-location-ids', defaultValue: [] })
  const storedSelectedRootLocationIds = useMemo(
    () =>
      Array.isArray(storedSelectedRootLocationIdsRaw)
        ? storedSelectedRootLocationIdsRaw.filter((id): id is string => typeof id === 'string')
        : [],
    [storedSelectedRootLocationIdsRaw]
  )
  const [state, setState] = useState<TasksContextState>({
    sidebar: {
      isShowingTeams: false,
      isShowingWards: false,
      isShowingClinics: false,
      isShowingSavedViews: false,
    },
    selectedRootLocationIds: storedSelectedRootLocationIds.length > 0 ? storedSelectedRootLocationIds : undefined,
    isRootLocationReinitializing: false,
  })

  const { data: allLocationsData } = useLocations(
    { limit: 1000 },
    { skip: isAuthLoading || !identity }
  )

  const selectedRootLocationIdsForQuery = state.selectedRootLocationIds && state.selectedRootLocationIds.length > 0
    ? state.selectedRootLocationIds
    : undefined

  const { data, refetch: refetchGlobalData } = useGlobalData(
    {
      rootLocationIds: selectedRootLocationIdsForQuery
    },
    { skip: isAuthLoading || !identity }
  )
  const connectionStatus = useConnectionStatus()
  const prevConnectionStatusRef = useRef(connectionStatus)

  const prevRootLocationIdsRef = useRef<string>('')
  // Seed with the initial selection so the very first mount is not mistaken for a
  // change. Otherwise returning users (who have a stored selection) would flash
  // the full-screen reinitializing overlay on every page load even though their
  // selected locations never actually changed.
  const prevSelectedRootLocationIdsRef = useRef<string>(
    (state.selectedRootLocationIds || []).slice().sort().join(',')
  )

  useEffect(() => {
    const currentSelectedIds = (state.selectedRootLocationIds || []).slice().sort().join(',')
    if (prevSelectedRootLocationIdsRef.current !== currentSelectedIds) {
      prevSelectedRootLocationIdsRef.current = currentSelectedIds
      setState(prev => ({ ...prev, isRootLocationReinitializing: true }))
      queryClient.invalidateQueries()
    }
  }, [state.selectedRootLocationIds, queryClient])

  // A single, shared "root location picker" open-state. The selector button is
  // rendered in several places (desktop header + mobile sidebar) but they must
  // all drive one dialog instance — otherwise the mandatory first-load location
  // prompt opens once per mounted selector and the user sees stacked dialogs.
  const [isRootLocationPickerOpen, setRootLocationPickerOpen] = useState(false)
  const hasAutoOpenedPickerRef = useRef(false)

  useEffect(() => {
    const hasRootLocations = (state.rootLocations?.length ?? 0) > 0
    const hasSelection = (state.selectedRootLocationIds?.length ?? 0) > 0
    if (!hasAutoOpenedPickerRef.current && hasRootLocations && !hasSelection) {
      hasAutoOpenedPickerRef.current = true
      setRootLocationPickerOpen(true)
    }
  }, [state.rootLocations, state.selectedRootLocationIds])

  useEffect(() => {
    if (data?.me?.rootLocations) {
      const currentRootLocationIds = data.me.rootLocations.map(loc => loc.id).sort().join(',')

      if (prevRootLocationIdsRef.current && prevRootLocationIdsRef.current !== currentRootLocationIds) {
        queryClient.invalidateQueries()
      }
      prevRootLocationIdsRef.current = currentRootLocationIds
    }
  }, [data?.me?.rootLocations, queryClient])

  useEffect(() => {
    if (connectionStatus === 'connected' && prevConnectionStatusRef.current !== 'connected') {
      refetchGlobalData()
    }
    prevConnectionStatusRef.current = connectionStatus
  }, [connectionStatus, refetchGlobalData])

  const myTasksCount = data?.me?.tasks?.filter(t => !t.done).length ?? 0
  const scopedPatientCounts = data?.scopedPatientCounts
  const effectInputKey = [
    data?.me?.id ?? '',
    (data?.me?.rootLocations ?? []).map(l => l.id).sort().join(','),
    scopedPatientCounts?.scopedPatientsTotal ?? '',
    scopedPatientCounts?.scopedPatientsWaiting ?? '',
    scopedPatientCounts?.scopedPatientsAdmitted ?? '',
    scopedPatientCounts?.scopedPatientsDischarged ?? '',
    scopedPatientCounts?.scopedPatientsDeceased ?? '',
    (data?.me?.tasks ?? []).length,
    myTasksCount,
    (allLocationsData?.locationNodes ?? []).map(n => n.id).sort().join(','),
    (storedSelectedRootLocationIds ?? []).slice().sort().join(','),
  ].join('|')
  const prevEffectKeyRef = useRef<string>('')
  const hasCompletedFirstSyncRef = useRef(false)

  useEffect(() => {
    const skipped = prevEffectKeyRef.current === effectInputKey
    if (skipped) return
    prevEffectKeyRef.current = effectInputKey

    const backendRootLocations = data?.me?.rootLocations?.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })) ?? []
    const backendRootIds = new Set(backendRootLocations.map(loc => loc.id))

    const allNodes = allLocationsData?.locationNodes ?? []
    const allowedRootLocationIds = new Set(backendRootIds)
    allNodes.forEach((node: { id: string, kind?: string }) => {
      if (isAllowedRootKind(node.kind)) {
        allowedRootLocationIds.add(node.id)
      }
    })

    const validStoredIds =
      allowedRootLocationIds.size > 0
        ? storedSelectedRootLocationIds.filter(id => allowedRootLocationIds.has(id))
        : []

    const trimWouldWipeSelection =
      validStoredIds.length === 0 && storedSelectedRootLocationIds.length > 0
    if (
      allowedRootLocationIds.size > 0 &&
      validStoredIds.length !== storedSelectedRootLocationIds.length &&
      !trimWouldWipeSelection
    ) {
      try {
        setStoredSelectedRootLocationIds(validStoredIds)
      } catch {
        void 0
      }
    }

    setState(prevState => {
      let selectedRootLocationIds = prevState.selectedRootLocationIds || []

      if (allowedRootLocationIds.size > 0) {
        const isInitialSet =
          storedSelectedRootLocationIds.length === 0 && hasCompletedFirstSyncRef.current

        const validSelectedIds = selectedRootLocationIds.filter(id => allowedRootLocationIds.has(id))
        const filterWouldWipeSelection =
          validSelectedIds.length === 0 && storedSelectedRootLocationIds.length > 0
        if (
          validSelectedIds.length !== selectedRootLocationIds.length &&
          !filterWouldWipeSelection
        ) {
          selectedRootLocationIds = validSelectedIds
        }

        if (selectedRootLocationIds.length === 0 && validStoredIds.length > 0) {
          selectedRootLocationIds = validStoredIds
        }

        if (isInitialSet && selectedRootLocationIds.length === 0) {
          const backendIds = backendRootLocations.map(loc => loc.id)
          selectedRootLocationIds = backendIds
        }
      }

      const selectedIdsSet = new Set(selectedRootLocationIds)
      const rootLocations: Array<{ id: string, title: string, kind?: string }> = [...backendRootLocations]
      allNodes.forEach((node: { id: string, title: string, kind?: string }) => {
        if (selectedIdsSet.has(node.id) && isAllowedRootKind(node.kind) && !backendRootIds.has(node.id)) {
          rootLocations.push({ id: node.id, title: node.title, kind: node.kind })
        }
      })

      return {
        ...prevState,
        user: data?.me ? {
          id: data.me.id,
          name: data.me.name,
          avatarUrl: data.me.avatarUrl,
          organizations: data.me.organizations ?? null,
          isOnline: data.me.isOnline ?? null
        } : prevState.user,
        myTasksCount: data?.me?.tasks?.filter(t => !t.done).length ?? 0,
        scopedPatientsTotal: scopedPatientCounts?.scopedPatientsTotal,
        scopedPatientsWaiting: scopedPatientCounts?.scopedPatientsWaiting,
        scopedPatientsAdmitted: scopedPatientCounts?.scopedPatientsAdmitted,
        scopedPatientsDischarged: scopedPatientCounts?.scopedPatientsDischarged,
        scopedPatientsDeceased: scopedPatientCounts?.scopedPatientsDeceased,
        teams: filterLocationsByRootSubtree(
          data?.teams || [],
          selectedRootLocationIds,
          rootLocations,
          allLocationsData?.locationNodes
        ),
        wards: filterLocationsByRootSubtree(
          data?.wards || [],
          selectedRootLocationIds,
          rootLocations,
          allLocationsData?.locationNodes
        ),
        clinics: filterLocationsByRootSubtree(
          data?.clinics || [],
          selectedRootLocationIds,
          rootLocations,
          allLocationsData?.locationNodes
        ),
        rootLocations,
        selectedRootLocationIds,
        isRootLocationReinitializing: false,
      }
    })
    hasCompletedFirstSyncRef.current = true
  }, [effectInputKey, data, storedSelectedRootLocationIds, allLocationsData, setStoredSelectedRootLocationIds])

  const lastWrittenLocationIdsRef = useRef<string[] | undefined>(undefined)

  useEffect(() => {
    if (state.selectedRootLocationIds === undefined) {
      return
    }
    const currentIds = state.selectedRootLocationIds
    const skipBecauseStoredHasContent =
      currentIds.length === 0 && storedSelectedRootLocationIds.length > 0
    if (skipBecauseStoredHasContent) {
      return
    }
    const lastWritten = lastWrittenLocationIdsRef.current
    const shouldWrite = JSON.stringify(currentIds) !== JSON.stringify(lastWritten)
    if (shouldWrite) {
      lastWrittenLocationIdsRef.current = currentIds
      try {
        setStoredSelectedRootLocationIds(currentIds)
      } catch {
        void 0
      }
    }
  }, [
    state.selectedRootLocationIds,
    storedSelectedRootLocationIds.length,
    setStoredSelectedRootLocationIds,
  ])

  const updateState: Dispatch<SetStateAction<TasksContextState>> = (updater) => {
    setState(prevState => {
      const newState = typeof updater === 'function' ? updater(prevState) : updater
      if (newState.selectedRootLocationIds !== prevState.selectedRootLocationIds) {
        const idsToStore = Array.isArray(newState.selectedRootLocationIds)
          ? newState.selectedRootLocationIds.filter((id): id is string => typeof id === 'string')
          : []
        try {
          setStoredSelectedRootLocationIds(idsToStore)
        } catch {
          void 0
        }
      }
      return newState
    })
  }

  return (
    <TasksContext.Provider
      value={{
        route: pathName,
        update: updateState,
        isRootLocationPickerOpen,
        setRootLocationPickerOpen,
        ...state
      }}
    >
      {children}
      {state.isRootLocationReinitializing && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface/90"
          aria-hidden="true"
        >
          <HelpwaveLogo
            animate="loading"
            color="currentColor"
            height={128}
            width={128}
          />
        </div>
      )}
    </TasksContext.Provider>
  )
}
