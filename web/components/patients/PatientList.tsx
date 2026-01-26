import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react'
import { Chip, FillerCell, Button, SearchBar, ProgressIndicator, Tooltip, Checkbox, Drawer, Visibility, TableProvider, TableDisplay, TablePagination, TableColumnSwitcher } from '@helpwave/hightide'
import { PlusIcon, Table as TableIcon, LayoutGrid, Printer } from 'lucide-react'
import { GetPatientsDocument, Sex, PatientState, type GetPatientsQuery, type TaskType } from '@/api/gql/generated'
import { usePaginatedGraphQLQuery } from '@/hooks/usePaginatedQuery'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { usePatientViewToggle } from '@/hooks/useViewToggle'
import { PatientCardView } from '@/components/patients/PatientCardView'
import type { ColumnDef, Row } from '@tanstack/table-core'

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

const STORAGE_KEY_SHOW_ALL_PATIENTS = 'patient-show-all-states'

export type PatientListRef = {
  openCreate: () => void,
  openPatient: (patientId: string) => void,
}

type PatientListProps = {
  initialPatientId?: string,
  onInitialPatientOpened?: () => void,
  acceptedStates?: PatientState[],
  rootLocationIds?: string[],
}

export const PatientList = forwardRef<PatientListRef, PatientListProps>(({ initialPatientId, onInitialPatientOpened, acceptedStates, rootLocationIds }, ref) => {
  const translation = useTasksTranslation()
  const { selectedRootLocationIds } = useTasksContext()
  const effectiveRootLocationIds = rootLocationIds ?? selectedRootLocationIds
  const { viewType, toggleView } = usePatientViewToggle()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [openedPatientId, setOpenedPatientId] = useState<string | null>(null)
  const [showAllPatients, setShowAllPatients] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_SHOW_ALL_PATIENTS)
      if (stored === 'true') {
        return true
      }
      if (stored === 'false') {
        return false
      }
    }
    return false
  })

  const [isPrinting, setIsPrinting] = useState(false)

  const handleShowAllPatientsChange = (checked: boolean) => {
    setShowAllPatients(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SHOW_ALL_PATIENTS, String(checked))
      }
      return checked
    })
  }

  const allPatientStates: PatientState[] = useMemo(() => [
    PatientState.Admitted,
    PatientState.Discharged,
    PatientState.Dead,
    PatientState.Wait,
  ], [])

  const patientStates = showAllPatients ? allPatientStates : (acceptedStates ?? [PatientState.Admitted])

  const { data: patientsData, refetch } = usePaginatedGraphQLQuery<GetPatientsQuery, GetPatientsQuery['patients'][0], { rootLocationIds?: string[], states?: PatientState[] }>({
    queryKey: ['GetPatients', { rootLocationIds: effectiveRootLocationIds, states: patientStates }],
    document: GetPatientsDocument,
    baseVariables: {
      rootLocationIds: effectiveRootLocationIds && effectiveRootLocationIds.length > 0 ? effectiveRootLocationIds : undefined,
      states: patientStates
    },
    pageSize: 50,
    extractItems: (result) => result.patients,
    mode: 'infinite',
    enabled: !isPrinting,
    refetchOnWindowFocus: !isPrinting,
    refetchOnMount: true,
  })

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const patients: PatientViewModel[] = useMemo(() => {
    if (!patientsData || patientsData.length === 0) return []

    let data = patientsData.map(p => ({
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
  }, [patientsData, searchQuery])

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
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  useEffect(() => {
    if (initialPatientId && openedPatientId !== initialPatientId) {
      const patient = patients.find(p => p.id === initialPatientId)
      if (patient) {
        setSelectedPatient(patient)
      }
      setIsPanelOpen(true)
      setOpenedPatientId(initialPatientId)
      onInitialPatientOpened?.()
    }
  }, [initialPatientId, patients, openedPatientId, onInitialPatientOpened])

  const handleEdit = useCallback((patient: PatientViewModel) => {
    setSelectedPatient(patient)
    setIsPanelOpen(true)
  }, [])

  const handleClose = () => {
    setIsPanelOpen(false)
    setSelectedPatient(undefined)
    setOpenedPatientId(null)
  }

  const handlePrint = () => {
    window.print()
  }

  const columns = useMemo<ColumnDef<PatientViewModel>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 200,
      size: 250,
      maxSize: 300,
      filterFn: 'text',
    },
    {
      id: 'state',
      header: translation('status'),
      accessorFn: ({ state }) => [state],
      cell: ({ row }) => (
        <PatientStateChip state={row.original.state} />
      ),
      minSize: 120,
      size: 144,
      maxSize: 180,
      filterFn: 'tags',
      meta: {
        filterData: {
          tags: allPatientStates.map(state => ({ label: translation('patientState', { state: state as string }), tag: state })),
        }
      }
    },
    {
      id: 'sex',
      header: translation('sex'),
      accessorFn: ({ sex }) => [sex],
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
            color={sex === Sex.Unknown ? 'neutral' : undefined}
            coloringStyle="tonal"
            size="sm"
            className={`${colorClass} font-[var(--font-space-grotesk)] uppercase text-xs`}
          >
            <span>{label}</span>
          </Chip>
        )
      },
      minSize: 120,
      size: 120,
      maxSize: 150,
      filterFn: 'tags',
      meta: {
        filterData: {
          tags: [
            { label: translation('male'), tag: Sex.Male },
            { label: translation('female'), tag: Sex.Female },
            { label: translation('diverse'), tag: Sex.Unknown },
          ],
        }
      }
    },
    {
      id: 'position',
      header: translation('location'),
      accessorFn: ({ position }) => position?.title,
      cell: ({ row }) => (
        <LocationChips locations={row.original.position ? [row.original.position] : []} small />
      ),
      minSize: 200,
      size: 250,
      maxSize: 400,
      filterFn: 'text',
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
      minSize: 160,
      size: 160,
      maxSize: 200,
      filterFn: 'date',
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
      minSize: 120,
      size: 120,
      maxSize: 150,
    },
  ], [allPatientStates, translation])

  const onRowClick = useCallback((row: Row<PatientViewModel>) => handleEdit(row.original), [handleEdit])
  const fillerRowCell = useCallback(() => (<FillerCell className="min-h-8" />), [])

  return (
    <TableProvider
      data={patients}
      columns={columns}
      fillerRowCell={fillerRowCell}
      onRowClick={onRowClick}
      initialState={{
        pagination: {
          pageSize: 25,
        }
      }}
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
          <div className="flex-row-2 items-center">
            <SearchBar
              placeholder={translation('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={() => null}
            />
            <Visibility isVisible={viewType === 'table'}>
              <TableColumnSwitcher />
            </Visibility>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto sm:ml-auto">
            <div className="flex items-center gap-2">
              <Checkbox
                value={showAllPatients}
                onValueChange={handleShowAllPatientsChange}
              />
              <span className="text-sm text-description whitespace-nowrap">{translation('showAllPatients') || 'Show all patients'}</span>
            </div>
            <Tooltip tooltip={translation(viewType !== 'table' ? 'printOnlyAvailableInTableMode' : 'print')} position="top">
              <Button
                layout="icon"
                color="neutral"
                coloringStyle="text"
                onClick={handlePrint}
                className="print-button"
                disabled={viewType !== 'table'}
              >
                <Printer className="size-5" />
              </Button>
            </Tooltip>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Tooltip tooltip={translation('tableView')} position="top">
                <Button
                  layout="icon"
                  color={viewType === 'table' ? 'primary' : 'neutral'}
                  coloringStyle={viewType === 'table' ? undefined : 'text'}
                  onClick={() => toggleView('table')}
                >
                  <TableIcon className="size-5" />
                </Button>
              </Tooltip>
              <Tooltip tooltip={translation('cardView')} position="top">
                <Button
                  layout="icon"
                  color={viewType === 'card' ? 'primary' : 'neutral'}
                  coloringStyle={viewType === 'card' ? undefined : 'text'}
                  onClick={() => toggleView('card')}
                >
                  <LayoutGrid className="size-5" />
                </Button>
              </Tooltip>
            </div>
            <Tooltip tooltip={translation('addPatient')} position="top">
              <Button
                onClick={() => {
                  setSelectedPatient(undefined)
                  setIsPanelOpen(true)
                }}
                layout="icon"
              >
                <PlusIcon />
              </Button>
            </Tooltip>
          </div>
        </div>
        <Visibility isVisible={viewType === 'table'}>
          <TableDisplay
            className="print-content"
          />
          <TablePagination />
        </Visibility>
        <Visibility isVisible={viewType === 'card'}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4 print-content">
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
        </Visibility>
        <Drawer
          isOpen={isPanelOpen}
          onClose={handleClose}
          alignment="right"
          titleElement={!selectedPatient && !openedPatientId ? translation('addPatient') : translation('editPatient')}
          description={undefined}
        >
          <PatientDetailView
            patientId={selectedPatient?.id ?? openedPatientId ?? undefined}
            onClose={handleClose}
            onSuccess={refetch}
          />
        </Drawer>
      </div>
    </TableProvider>
  )
})

PatientList.displayName = 'PatientList'
