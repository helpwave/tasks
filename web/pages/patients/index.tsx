import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Table, Chip, FillerRowElement, Button } from '@helpwave/hightide'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { EditIcon, PlusIcon } from 'lucide-react'
import type { TaskType } from '@/api/gql/generated'
import { useGetPatientsQuery, Sex, type GetPatientsQuery } from '@/api/gql/generated'
import { useTasksContext } from '@/hooks/useTasksContext'
import { SidePanel } from '@/components/layout/SidePanel'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'

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

const PatientsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { selectedLocationId } = useTasksContext()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)

  const { data: queryData, refetch } = useGetPatientsQuery({
    locationId: selectedLocationId
  })

  const patients: PatientViewModel[] = useMemo(() => {
    if (!queryData?.patients) return []

    return queryData.patients.map(p => ({
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
  }, [queryData])

  const handleEdit = (patient: PatientViewModel) => {
    setSelectedPatient(patient)
    setIsPanelOpen(true)
  }

  const handleAdd = () => {
    setSelectedPatient(undefined)
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
    <Page pageTitle={titleWrapper(translation('patients'))}>
      <ContentPanel
        titleElement={translation('patients')}
        description={translation('nPatient', { count: patients.length })}
        actionElement={(
          <Button startIcon={<PlusIcon />} onClick={handleAdd}>
            {translation('addPatient')}
          </Button>
        )}
      >
        <Table
          className="w-full h-full"
          data={patients}
          columns={columns}
          fillerRow={() => (<FillerRowElement className="min-h-12" />)}
        />
      </ContentPanel>
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
    </Page>
  )
}

export default PatientsPage
