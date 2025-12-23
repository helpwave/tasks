import type { Dispatch, SetStateAction } from 'react'
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useGetGlobalDataQuery } from '@/api/gql/generated'
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

  useEffect(() => {
    const totalPatientsCount = data?.patients?.length ?? 0
    const waitingPatientsCount = data?.waitingPatients?.length ?? 0
    const rootLocations = data?.me?.rootLocations?.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })) ?? []
    
    setState(prevState => {
      let selectedRootLocationIds = prevState.selectedRootLocationIds || []
      
      if (rootLocations.length > 0) {
        const validIds = selectedRootLocationIds.filter(id => rootLocations.find(loc => loc.id === id))
        if (validIds.length === 0) {
          selectedRootLocationIds = [rootLocations[0].id]
          setStoredSelectedRootLocationIds(selectedRootLocationIds)
        } else {
          selectedRootLocationIds = validIds
          if (selectedRootLocationIds.length !== prevState.selectedRootLocationIds?.length) {
            setStoredSelectedRootLocationIds(selectedRootLocationIds)
          }
        }
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
  }, [data, setStoredSelectedRootLocationIds])
  
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