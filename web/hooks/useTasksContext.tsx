import type { Dispatch, SetStateAction } from 'react'
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from 'oidc-client-ts'
import { getUser } from '@/api/auth/authService'

export type Team = {
  id: string,
  name: string,
}

export type Ward = {
  id: string,
  name: string,
}

type SidebarContextType = {
  isShowingTeams: boolean,
  isShowingWards: boolean,
}

export type TasksContextState = {
  myTasksCount?: number,
  teams?: Team[],
  wards?: Ward[],
  sidebar: SidebarContextType,
}

export type TasksContextType = TasksContextState & {
  route: string,
  user?: User,
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
  const [state, setState] = useState<TasksContextState>({
    sidebar: {
      isShowingTeams: false,
      isShowingWards: false,
    }
  })

  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      sidebar: {
        isShowingWards: pathName.startsWith('/wards') || prevState.sidebar.isShowingWards,
        isShowingTeams: pathName.startsWith('/teams') || prevState.sidebar.isShowingTeams,
      },
    }))
  }, [pathName])

  useEffect(() => {
    setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        myTasksCount: 10,
        teams: [
          { id: '1', name: 'Pflegefachkraft ICU' },
          { id: '2', name: 'Pflegefachkraft Pediatrie' }
        ],
        wards: [
          { id: '1', name: 'Chirugie 1' },
          { id: '2', name: 'Chirugie 2' },
          { id: '3', name: 'Chirugie 3' },
          { id: '4', name: 'Intensiv' },
        ]
      }))
    }, 2000)
  }, [])

  const [user, setUser] = useState<User>()
  // TODO use real query here
  useEffect(() => {
    getUser().then((user) => {
      if(user) {
        setUser(user)
      }
    })
  }, [])

  return (
    <TasksContext.Provider
      value={{
        route: pathName,
        update: setState,
        user,
        ...state
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}