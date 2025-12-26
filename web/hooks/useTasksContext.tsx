import type { Dispatch, SetStateAction } from 'react'
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useGetGlobalDataQuery, useGetLocationsQuery } from '@/api/gql/generated'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useLocalStorage } from '@helpwave/hightide'

function filterLocationsByRootSubtree(
  locations: Array<{ id: string, title: string, parentId?: string | null }>,
  selectedRootLocationIds: string[],
  rootLocations: Array<{ id: string, title: string, kind?: string }>,
  allLocations?: Array<{ id: string, title: string, parentId?: string | null }>
): Array<{ id: string, title: string, kind?: string }> {
  if (!selectedRootLocationIds || selectedRootLocationIds.length === 0) {
    return []
  }

  const rootLocationSet = new Set(selectedRootLocationIds)
  const allLocationsMap = new Map<string, { id: string, title: string, parentId?: string | null }>()

  if (allLocations) {
    allLocations.forEach(loc => allLocationsMap.set(loc.id, loc))
  }
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

type User = {
  id: string,
  name: string,
  avatarUrl?: string | null,
  organizations?: string | null,
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
}

export type TasksContextState = {
  myTasksCount?: number,
  totalPatientsCount?: number,
  locationPatientsCount?: number,
  waitingPatientsCount?: number,
  teams?: LocationNode[],
  wards?: LocationNode[],
  clinics?: LocationNode[],
  selectedLocationId?: string,
  selectedRootLocationIds?: string[],
  sidebar: SidebarContextType,
  user?: User,
  rootLocations?: LocationNode[],
}

export type TasksContextType = TasksContextState & {
  route: string,
  update: Dispatch<SetStateAction<TasksContextState>>,
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
  const pathName = usePathname()
  const { identity, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()
  const {
    value: storedSelectedRootLocationIds,
    setValue: setStoredSelectedRootLocationIds
  } = useLocalStorage<string[]>('selected-root-location-ids', [])
  const [state, setState] = useState<TasksContextState>({
    sidebar: {
      isShowingTeams: false,
      isShowingWards: false,
      isShowingClinics: false,
    },
    selectedRootLocationIds: storedSelectedRootLocationIds.length > 0 ? storedSelectedRootLocationIds : undefined,
  })

  const { data: allLocationsData } = useGetLocationsQuery(
    {},
    {
      enabled: !isAuthLoading && !!identity,
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
    }
  )

  const selectedRootLocationIdsForQuery = state.selectedRootLocationIds && state.selectedRootLocationIds.length > 0
    ? state.selectedRootLocationIds
    : undefined

  const { data } = useGetGlobalDataQuery(
    {
      rootLocationIds: selectedRootLocationIdsForQuery
    },
    {
      enabled: !isAuthLoading && !!identity,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )


  const prevRootLocationIdsRef = useRef<string>('')
  const prevSelectedRootLocationIdsRef = useRef<string>('')

  useEffect(() => {
    const currentSelectedIds = (state.selectedRootLocationIds || []).sort().join(',')
    if (prevSelectedRootLocationIdsRef.current !== currentSelectedIds) {
      prevSelectedRootLocationIdsRef.current = currentSelectedIds
      queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
    }
  }, [state.selectedRootLocationIds, queryClient])

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
    const totalPatientsCount = data?.patients?.length ?? 0
    const waitingPatientsCount = data?.waitingPatients?.length ?? 0
    const rootLocations = data?.me?.rootLocations?.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })) ?? []

    setState(prevState => {
      let selectedRootLocationIds = prevState.selectedRootLocationIds || []


      if (rootLocations.length > 0 && selectedRootLocationIds.length === 0 && storedSelectedRootLocationIds.length === 0) {
        selectedRootLocationIds = [rootLocations[0]!.id]
      }

      return {
        ...prevState,
        user: data?.me ? {
          id: data.me.id,
          name: data.me.name,
          avatarUrl: data.me.avatarUrl,
          organizations: data.me.organizations ?? null
        } : undefined,
        myTasksCount: data?.me?.tasks?.filter(t => !t.done).length ?? 0,
        totalPatientsCount,
        waitingPatientsCount,
        locationPatientsCount: prevState.selectedLocationId
          ? data?.patients?.filter(p => p.assignedLocation?.id === prevState.selectedLocationId).length ?? 0
          : totalPatientsCount,
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
      }
    })
  }, [data, storedSelectedRootLocationIds, allLocationsData])

  const lastWrittenLocationIdsRef = useRef<string[] | undefined>(undefined)

  useEffect(() => {
    if (state.selectedRootLocationIds !== undefined) {
      const currentIds = state.selectedRootLocationIds
      const lastWritten = lastWrittenLocationIdsRef.current
      if (JSON.stringify(currentIds) !== JSON.stringify(lastWritten)) {
        lastWrittenLocationIdsRef.current = currentIds
        setStoredSelectedRootLocationIds(currentIds)
      }
    }
  }, [state.selectedRootLocationIds, setStoredSelectedRootLocationIds])

  const updateState: Dispatch<SetStateAction<TasksContextState>> = (updater) => {
    setState(prevState => {
      const newState = typeof updater === 'function' ? updater(prevState) : updater
      if (newState.selectedRootLocationIds !== prevState.selectedRootLocationIds) {
        setStoredSelectedRootLocationIds(newState.selectedRootLocationIds || [])
      }
      return newState
    })
  }

  return (
    <TasksContext.Provider
      value={{
        route: pathName,
        update: updateState,
        ...state
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}