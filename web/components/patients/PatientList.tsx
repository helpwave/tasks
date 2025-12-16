import { useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import { Table, Chip, FillerRowElement, Button, SearchBar } from '@helpwave/hightide'
import { EditIcon } from 'lucide-react'
import { useGetPatientsQuery, Sex, type GetPatientsQuery, type TaskType } from '@/api/gql/generated'
import { SidePanel } from '@/components/layout/SidePanel'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef } from '@tanstack/table-core'

type PatientViewModel = {
  id: string,
  name: string,
  firstname: string,
  lastname: string,
  locations: GetPatientsQuery['patients'][0]['assignedLocations'],
  openTasksCount: number,
  birthdate: Date,
  sex: Sex,
  tasks: TaskType[],
}

export type PatientListRef = {
  openCreate: () => void,
}

type PatientListProps = {
  locationId?: string,
}

export const PatientList = forwardRef<PatientListRef, PatientListProps>(({ locationId }, ref) => {
  const translation = useTasksTranslation()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: queryData, refetch } = useGetPatientsQuery({
    locationId: locationId
  })

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      setSelectedPatient(undefined)
      setIsPanelOpen(true)
    }
  }))

  const patients: PatientViewModel[] = useMemo(() => {
    if (!queryData?.patients) return []

    let data = queryData.patients.map(p => ({
      id: p.id,
      name: p.name,
      firstname: p.firstname,
      lastname: p.lastname,
      birthdate: new Date(p.birthdate),
      sex: p.sex,
      locations: p.assignedLocations as PatientViewModel['locations'],
      openTasksCount: p.tasks?.filter(t => !t.done).length ?? 0,
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
      id: 'tasks',
      header: translation('tasks'),
      accessorKey: 'openTasksCount',
      cell: ({ row }) => (
        <span className={row.original.openTasksCount > 0 ? 'font-bold text-primary' : 'text-description'}>
          {row.original.openTasksCount}
        </span>
      ),
      minSize: 100,
      size: 100,
      maxSize: 200,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          coloringStyle="text" layout="icon" color="neutral"
          onClick={() => handleEdit(row.original)}
        >
          <EditIcon />
        </Button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 77,
      minSize: 77,
      maxSize: 77
    }
  ], [translation])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="w-full max-w-md">
        <SearchBar
          placeholder={translation('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Table
        className="w-full h-full"
        data={patients}
        columns={columns}
        fillerRow={() => (<FillerRowElement className="min-h-12" />)}
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
