import { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Table, Chip, FillerRowElement, Button, SearchBar, ProgressIndicator, Tooltip } from '@helpwave/hightide'
import { PlusIcon, Table as TableIcon, LayoutGrid } from 'lucide-react'
import { useGetPatientsQuery, Sex, type GetPatientsQuery, type TaskType, type PatientState } from '@/api/gql/generated'
import { SidePanel } from '@/components/layout/SidePanel'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { usePatientViewToggle } from '@/hooks/useViewToggle'
import { PatientCardView } from '@/components/patients/PatientCardView'
import type { ColumnDef } from '@tanstack/table-core'

export type PatientViewModel = {
  id: string,
  name: string,
  firstname: string,
  lastname: string,
  position: GetPatientsQuery['patients'][0]['position'],
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
  const { selectedRootLocationIds } = useTasksContext()
  const { viewType, toggleView } = usePatientViewToggle()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [openedPatientId, setOpenedPatientId] = useState<string | null>(null)

  const { data: queryData, refetch } = useGetPatientsQuery(
    {
      locationId: locationId,
      rootLocationIds: selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined,
      states: acceptedStates
    },
    {
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

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
      position: p.position,
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
    if (initialPatientId && patients.length > 0 && openedPatientId !== initialPatientId) {
      const patient = patients.find(p => p.id === initialPatientId)
      if (patient) {
        setSelectedPatient(patient)
        setIsPanelOpen(true)
        setOpenedPatientId(initialPatientId)
        onInitialPatientOpened?.()
      }
    } else if (!initialPatientId) {
      setOpenedPatientId(null)
    }
  }, [initialPatientId, patients, openedPatientId, onInitialPatientOpened])

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
      minSize: 120,
      size: 144,
      maxSize: 180,
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
            className={`${colorClass} font-[var(--font-space-grotesk)] uppercase text-xs`}
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
      id: 'position',
      header: translation('location'),
      accessorKey: 'position',
      cell: ({ row }) => (
        <LocationChips locations={row.original.position ? [row.original.position] : []} small />
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
      minSize: 90,
      size: 100,
    },
    {
      id: 'tasks',
      header: translation('tasks'),
      accessorFn: ({ openTasksCount, closedTasksCount }) => {
        const total = openTasksCount + closedTasksCount
        return total === 0 ? 0 : closedTasksCount / total
      },
      cell: ({ row }) => {
        const { openTasksCount, closedTasksCount } = row.original
        const total = openTasksCount + closedTasksCount
        const progress = total === 0 ? 0 : closedTasksCount / total
        const tooltipText = `${translation('openTasks')}: ${openTasksCount}\n${translation('closedTasks')}: ${closedTasksCount}`

        return (
          <Tooltip
            tooltip={tooltipText}
            position="top"
            tooltipClassName="whitespace-pre-line"
          >
            <div className="w-full max-w-[80px]">
              <ProgressIndicator progress={progress} rotation={-90} />
            </div>
          </Tooltip>
        )
      },
      minSize: 80,
      size: 110,
      maxSize: 130,
    },
  ], [translation])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row justify-between w-full gap-4 -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4">
        <div className="w-full sm:max-w-md">
          <SearchBar
            placeholder={translation('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={() => null}
          />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip tooltip="Table View" position="top">
            <Button
              layout="icon"
              color={viewType === 'table' ? 'primary' : 'neutral'}
              coloringStyle={viewType === 'table' ? undefined : 'text'}
              onClick={() => toggleView('table')}
            >
              <TableIcon className="size-5" />
            </Button>
          </Tooltip>
          <Tooltip tooltip="Card View" position="top">
            <Button
              layout="icon"
              color={viewType === 'card' ? 'primary' : 'neutral'}
              coloringStyle={viewType === 'card' ? undefined : 'text'}
              onClick={() => toggleView('card')}
            >
              <LayoutGrid className="size-5" />
            </Button>
          </Tooltip>
          <Button
            startIcon={<PlusIcon />}
            onClick={() => {
              setSelectedPatient(undefined)
              setIsPanelOpen(true)
            }}
            className="w-full sm:w-auto min-w-[13rem]"
          >
            {translation('addPatient')}
          </Button>
        </div>
      </div>
      {viewType === 'table' ? (
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4">
          <Table
            className="w-full h-full cursor-pointer min-w-[800px]"
            data={patients}
            columns={columns}
            fillerRow={() => (<FillerRowElement className="min-h-12" />)}
            onRowClick={(row) => handleEdit(row.original)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4">
          {patients.length === 0 ? (
            <div className="col-span-full text-center text-description py-8">
              {translation('noPatient')}
            </div>
          ) : (
            patients.map((patient) => (
              <PatientCardView
                key={patient.id}
                patient={patient}
                onClick={handleEdit}
              />
            ))
          )}
        </div>
      )}
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
