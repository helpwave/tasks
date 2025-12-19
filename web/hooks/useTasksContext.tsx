import type { Dispatch, SetStateAction } from 'react'
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useGetGlobalDataQuery } from '@/api/gql/generated'
import { useAuth } from './useAuth'

type User = {
  id: string,
  name: string,
  avatarUrl?: string | null,
}

type LocationNode = {
  id: string,
  title: string,
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
  sidebar: SidebarContextType,
  user?: User,
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
  const [state, setState] = useState<TasksContextState>({
    sidebar: {
      isShowingTeams: false,
      isShowingWards: false,
      isShowingClinics: false,
    }
  })

  const { data } = useGetGlobalDataQuery(undefined, {
    enabled: !isAuthLoading && !!identity,
  })

  useEffect(() => {
    const totalPatientsCount = data?.patients?.length ?? 0
    const waitingPatientsCount = data?.waitingPatients?.length ?? 0
    setState(prevState => ({
      ...prevState,
      user: data?.me ? {
        id: data.me.id,
        name: data.me.name,
        avatarUrl: data.me.avatarUrl
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
    }))
  }, [data])

  return (
    <TasksContext.Provider
      value={{
        route: pathName,
        update: setState,
        ...state
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}