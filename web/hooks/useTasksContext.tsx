import type { Dispatch, SetStateAction } from 'react'
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useGetGlobalDataQuery, useLocationNodeUpdatedSubscription } from '@/api/gql/generated'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useLocalStorage } from '@helpwave/hightide'

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

  const { data } = useGetGlobalDataQuery(undefined, {
    enabled: !isAuthLoading && !!identity,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  // Subscribe to location updates and invalidate all queries when locations change
  // Note: This will be available after running codegen
  // useLocationNodeUpdatedSubscription(
  //   { locationId: undefined },
  //   {
  //     enabled: !isAuthLoading && !!identity,
  //     onData: () => {
  //       // Invalidate all queries when a location is updated
  //       queryClient.invalidateQueries()
  //     },
  //   }
  // )

  // Track previous root location IDs to detect changes
  const prevRootLocationIdsRef = useRef<string>('')

  // Invalidate all queries when root locations change (this handles location node updates)
  useEffect(() => {
    if (data?.me?.rootLocations) {
      const currentRootLocationIds = data.me.rootLocations.map(loc => loc.id).sort().join(',')
      
      if (prevRootLocationIdsRef.current && prevRootLocationIdsRef.current !== currentRootLocationIds) {
        // Root locations changed, invalidate all queries to reload global state
        queryClient.invalidateQueries()
      }
      prevRootLocationIdsRef.current = currentRootLocationIds
    }
  }, [data?.me?.rootLocations, queryClient])

  useEffect(() => {
    const totalPatientsCount = data?.patients?.length ?? 0
    const waitingPatientsCount = data?.waitingPatients?.length ?? 0
    const rootLocations = data?.me?.rootLocations?.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })) ?? []
    
    // Debug logging - use console.log so it's always visible
    console.log('[DEBUG] useTasksContext - data?.me:', data?.me)
    if (data?.me?.organizations) {
      console.log('[DEBUG] Organizations (raw):', data.me.organizations)
      console.log('[DEBUG] Organizations (parsed):', data.me.organizations.split(',').map(org => org.trim()))
    }
    console.log('[DEBUG] Root Locations count:', rootLocations.length)
    if (rootLocations.length > 0) {
      console.log('[DEBUG] Root Locations:', rootLocations)
    } else {
      console.log('[DEBUG] No root locations found. data?.me?.rootLocations:', data?.me?.rootLocations)
    }
    
    setState(prevState => {
      let selectedRootLocationIds = prevState.selectedRootLocationIds || []
      
      if (rootLocations.length > 0) {
        const validIds = selectedRootLocationIds.filter(id => rootLocations.find(loc => loc.id === id))
        // If no valid IDs and no localStorage state, auto-select only the first root location
        if (validIds.length === 0 && storedSelectedRootLocationIds.length === 0) {
          // Auto-select first root location if none selected and no localStorage state
          selectedRootLocationIds = [rootLocations[0].id]
          console.log('[DEBUG] Auto-selected first root location (no localStorage):', rootLocations[0].id)
        } else if (validIds.length === 0 && storedSelectedRootLocationIds.length > 0) {
          // If localStorage has values but they're not valid, clear localStorage and use first
          selectedRootLocationIds = [rootLocations[0].id]
          setStoredSelectedRootLocationIds([])
          console.log('[DEBUG] Cleared invalid localStorage, auto-selected first root location:', rootLocations[0].id)
        } else {
          selectedRootLocationIds = validIds
        }
      } else if (selectedRootLocationIds.length > 0) {
        // If we have selected IDs but no root locations, clear the selection
        // This happens when locations are removed or user's organizations change
        console.log('[DEBUG] Clearing selectedRootLocationIds because rootLocations is empty')
        selectedRootLocationIds = []
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
        teams: data?.teams,
        wards: data?.wards,
        clinics: data?.clinics,
        rootLocations,
        selectedRootLocationIds,
      }
    })
  }, [data])

  // Use refs to track what we last wrote to localStorage to avoid loops
  const lastWrittenLocationIdsRef = useRef<string[] | undefined>(undefined)

  // Separate effect to sync state changes to localStorage
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