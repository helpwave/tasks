import React, { createContext, useContext, useMemo, useState } from 'react'
import { useGetGlobalDataQuery } from '@/api/gql/generated'

type LocationNode = {
  id: string,
  title: string,
}

type GlobalContextType = {
  user: {
    id: string,
    name: string,
    avatarUrl?: string | null,
  } | null,
  selectedLocation: string | null,
  setSelectedLocation: (id: string | null) => void,
  wards: LocationNode[],
  teams: LocationNode[],
  stats: {
    myOpenTasksCount: number,
    totalPatientsCount: number,
    locationPatientsCount: number,
  },
  isLoading: boolean,
}

const GlobalContext = createContext<GlobalContextType>({
  user: null,
  selectedLocation: null,
  setSelectedLocation: () => { },
  wards: [],
  teams: [],
  stats: {
    myOpenTasksCount: 0,
    totalPatientsCount: 0,
    locationPatientsCount: 0
  },
  isLoading: true
})

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading } = useGetGlobalDataQuery()
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const value = useMemo(() => {
    const user = data?.me ? {
      id: data.me.id,
      name: data.me.name,
      avatarUrl: data.me.avatarUrl
    } : null

    const myOpenTasksCount = data?.me?.tasks?.filter(t => !t.done).length ?? 0
    const totalPatientsCount = data?.patients?.length ?? 0

    const locationPatientsCount = selectedLocation
      ? data?.patients?.filter(p => p.assignedLocation?.id === selectedLocation).length ?? 0
      : totalPatientsCount

    return {
      user,
      selectedLocation,
      setSelectedLocation,
      wards: data?.wards ?? [],
      teams: data?.teams ?? [],
      stats: {
        myOpenTasksCount,
        totalPatientsCount,
        locationPatientsCount
      },
      isLoading
    }
  }, [data, selectedLocation, isLoading])

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobalContext = () => useContext(GlobalContext)
