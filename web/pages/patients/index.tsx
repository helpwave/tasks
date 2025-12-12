import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { IconButton, Table, Tooltip, Chip } from '@helpwave/hightide'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { EditIcon } from 'lucide-react'
import { useGetPatientsQuery } from '@/api/gql/generated'
import { useGlobalContext } from '@/context/GlobalContext'

type PatientViewModel = {
  id: string,
  name: string,
  location?: string,
  subLocation?: string,
  openTasksCount: number,
  birthdate: Date,
  sex: string,
}

const getAge = (birthDate: Date) => {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const PatientsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { selectedLocation } = useGlobalContext()

  const { data: queryData } = useGetPatientsQuery(
    { locationId: selectedLocation }
  )

  const patients: PatientViewModel[] = useMemo(() => {
    if (!queryData?.patients) return []

    return queryData.patients.map(p => ({
      id: p.id,
      name: p.name,
      birthdate: new Date(p.birthdate),
      sex: p.sex,
      location: p.assignedLocation?.parent?.title,
      subLocation: p.assignedLocation?.title,
      openTasksCount: p.tasks?.filter(t => !t.done).length ?? 0
    }))
  }, [queryData])

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
        const color = sex === 'MALE' ? 'blue' : sex === 'FEMALE' ? 'red' : 'default'

        return (
          <Chip color={color} size="sm">
            <span className="capitalize">{sex.toLowerCase()}</span>
          </Chip>
        )
      },
      minSize: 100,
      size: 100,
      maxSize: 150,
    },
    {
      id: 'place',
      header: translation('place'),
      accessorFn: ({ location, subLocation }) => [location, subLocation].filter(Boolean).join(' - '),
      cell: ({ row }) => {
        const data = row.original
        const unassigned = !data.location && !data.subLocation
        if (unassigned) {
          return (
            <span className="text-description">
              {translation('notAssigned')}
            </span>
          )
        }
        return (
          <div className="flex-col-0">
            <span className="typography-label-sm font-bold">
              {data.location ?? translation('notAssigned')}
            </span>
            <span className="text-description">
              {data.subLocation}
            </span>
          </div>
        )
      },
      minSize: 150,
      size: 150,
      maxSize: 250,
    },
    {
      id: 'birthdate',
      header: translation('birthdate'),
      accessorKey: 'birthdate',
      cell: ({ row }) => {
        const date = row.original.birthdate
        const age = getAge(date)
        return (
          <Tooltip tooltip={translation('nYear', { count: age })}>
            <span>{date.toLocaleDateString()}</span>
          </Tooltip>
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
        <IconButton
          color="transparent"
          onClick={() => console.log(`clicked on settings of ${row.original.name}`)}
        >
          <EditIcon />
        </IconButton>
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
        title={translation('patients')}
        description={translation('nPatient', { count: patients.length })}
      >
        <Table
          className="w-full h-full"
          data={patients}
          columns={columns}
        />
      </ContentPanel>
    </Page>
  )
}

export default PatientsPage
