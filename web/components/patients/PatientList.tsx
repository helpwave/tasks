import { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Table, Chip, FillerRowElement, Button, SearchBar } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import { useGetPatientsQuery, Sex, type GetPatientsQuery, type TaskType, type PatientState, PatientState as PatientStateEnum } from '@/api/gql/generated'
import { SidePanel } from '@/components/layout/SidePanel'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef } from '@tanstack/table-core'

type PatientViewModel = {
  id: string,
  name: string,
  firstname: string,
  lastname: string,
  locations: GetPatientsQuery['patients'][0]['assignedLocations'],
  openTasksCount: number,
  closedTasksCount: number,
  birthdate: Date,
  sex: Sex,
  state: PatientState,
  tasks: TaskType[],
}

export type PatientListRef = {
  openCreate: () => void,
  openPatient: (patientId: string) => void,
}

type PatientListProps = {
  locationId?: string,
  initialPatientId?: string,
  onInitialPatientOpened?: () => void,
  acceptedStates?: PatientState[],
}

export const PatientList = forwardRef<PatientListRef, PatientListProps>(({ locationId, initialPatientId, onInitialPatientOpened, acceptedStates }, ref) => {
  const translation = useTasksTranslation()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [initialOpened, setInitialOpened] = useState(false)

  const { data: queryData, refetch } = useGetPatientsQuery({
    locationId: locationId,
    states: acceptedStates
  })

  const patients: PatientViewModel[] = useMemo(() => {
    if (!queryData?.patients) return []

    let data = queryData.patients.map(p => ({
      id: p.id,
      name: p.name,
      firstname: p.firstname,
      lastname: p.lastname,
      birthdate: new Date(p.birthdate),
      sex: p.sex,
      state: p.state,
      locations: p.assignedLocations as PatientViewModel['locations'],
      openTasksCount: p.tasks?.filter(t => !t.done).length ?? 0,
      closedTasksCount: p.tasks?.filter(t => t.done).length ?? 0,
      tasks: []
    }))

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      data = data.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.firstname.toLowerCase().includes(lowerQuery) ||
        p.lastname.toLowerCase().includes(lowerQuery))
    }

    return data
  }, [queryData, searchQuery])

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      setSelectedPatient(undefined)
      setIsPanelOpen(true)
    },
    openPatient: (patientId: string) => {
      const patient = patients.find(p => p.id === patientId)
      if (patient) {
        setSelectedPatient(patient)
        setIsPanelOpen(true)
      }
    }
  }), [patients])

  useEffect(() => {
    if (initialPatientId && patients.length > 0 && !initialOpened) {
      const patient = patients.find(p => p.id === initialPatientId)
      if (patient) {
        setSelectedPatient(patient)
        setIsPanelOpen(true)
        setInitialOpened(true)
        onInitialPatientOpened?.()
      }
    }
  }, [initialPatientId, patients, initialOpened, onInitialPatientOpened])

  const handleEdit = (patient: PatientViewModel) => {
    setSelectedPatient(patient)
    setIsPanelOpen(true)
  }

  const handleClose = () => {
    setIsPanelOpen(false)
    setSelectedPatient(undefined)
  }

  const columns = useMemo<ColumnDef<PatientViewModel>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 200,
      size: 250,
      maxSize: 300,
    },
    {
      id: 'state',
      header: translation('status'),
      accessorKey: 'state',
      cell: ({ row }) => (
        <PatientStateChip state={row.original.state} />
      ),
      minSize: 100,
      size: 120,
      maxSize: 150,
    },
    {
      id: 'sex',
      header: translation('sex'),
      accessorKey: 'sex',
      cell: ({ row }) => {
        const sex = row.original.sex
        const colorClass = sex === Sex.Male
          ? '!gender-male'
          : sex === Sex.Female
            ? '!gender-female'
            : 'bg-gray-600 text-white'

        const label = {
          [Sex.Male]: translation('male'),
          [Sex.Female]: translation('female'),
          [Sex.Unknown]: translation('diverse'),
        }[sex] || sex

        return (
          <Chip
            color={sex === Sex.Unknown ? 'neutral' : 'none'}
            size="small"
            className={colorClass}
          >
            <span>{label}</span>
          </Chip>
        )
      },
      minSize: 100,
      size: 100,
      maxSize: 150,
    },
    {
      id: 'locations',
      header: translation('location'),
      accessorKey: 'locations',
      cell: ({ row }) => (
        <LocationChips locations={row.original.locations} />
      ),
      minSize: 200,
      size: 250,
      maxSize: 400,
    },
    {
      id: 'birthdate',
      header: translation('birthdate'),
      accessorKey: 'birthdate',
      cell: ({ row }) => {
        return (
          <SmartDate date={row.original.birthdate} showTime={false} />
        )
      },
      minSize: 100,
      size: 120,
    },
    {
      id: 'openTasks',
      header: translation('openTasks'),
      accessorKey: 'openTasksCount',
      cell: ({ row }) => (
        <span className={row.original.openTasksCount > 0 ? 'font-bold text-primary' : 'text-description'}>
          {row.original.openTasksCount}
        </span>
      ),
      minSize: 80,
      size: 100,
      maxSize: 150,
    },
    {
      id: 'closedTasks',
      header: translation('closedTasks'),
      accessorKey: 'closedTasksCount',
      cell: ({ row }) => (
        <span className="text-description">
          {row.original.closedTasksCount}
        </span>
      ),
      minSize: 80,
      size: 100,
      maxSize: 150,
    },
  ], [translation])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between w-full">
        <div className="w-full max-w-md">
          <SearchBar
            placeholder={translation('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={() => null}
          />
        </div>
        <Button
          startIcon={<PlusIcon />}
          onClick={() => {
            setSelectedPatient(undefined)
            setIsPanelOpen(true)
          }}
          className="min-w-[13rem]"
        >
          {translation('addPatient')}
        </Button>
      </div>
      <Table
        className="w-full h-full cursor-pointer"
        data={patients}
        columns={columns}
        fillerRow={() => (<FillerRowElement className="min-h-12" />)}
        onRowClick={(row) => handleEdit(row.original)}
      />
      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClose}
        title={!selectedPatient ? translation('addPatient') : translation('editPatient')}
      >
        <PatientDetailView
          patientId={selectedPatient?.id}
          onClose={handleClose}
          onSuccess={refetch}
        />
      </SidePanel>
    </div>
  )
})

PatientList.displayName = 'PatientList'
