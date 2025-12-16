import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useQuery } from '@tanstack/react-query'
import {
  Avatar,
  Button,
  CheckboxUncontrolled,
  Chip,
  FillerRowElement,
  LoadingContainer,
  Tab,
  Table,
  TabView
} from '@helpwave/hightide'
import {
  Sex,
  type TaskType,
  useCompleteTaskMutation,
  useGetMyTasksQuery,
  useGetPatientsQuery,
  useReopenTaskMutation
} from '@/api/gql/generated'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { SmartDate } from '@/utils/date'
import { EditIcon } from 'lucide-react'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { SidePanel } from '@/components/layout/SidePanel'
import clsx from 'clsx'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'

type Patients = {
  id: string,
  name: string,
}

type Ward = {
  id: string,
  name: string,
  patients: Patients[],
}

type PatientViewModel = {
  id: string,
  name: string,
  firstname: string,
  lastname: string,
  location?: string,
  locationId?: string,
  subLocation?: string,
  openTasksCount: number,
  birthdate: Date,
  sex: Sex,
  tasks: TaskType[],
}

type TaskViewModel = {
  id: string,
  name: string,
  description?: string,
  updateDate: Date,
  dueDate?: Date,
  patient?: { id: string, name: string },
  assignee?: { id: string, name: string, avatarURL?: string | null },
  ward?: { name: string },
  room?: { name: string },
  done: boolean,
}

const ward: Ward = {
  id: '1',
  name: 'Test Station',
  patients: [
    {
      id: 'p1',
      name: 'Alice Weber',
    },
    {
      id: 'p2',
      name: 'Jonas Schmidt',
    },
    {
      id: 'p3',
      name: 'Mira Hansen',
    },
  ],
}


const WardPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 1000))
      return ward
    }
  })

  const { data: patientsData, refetch: refetchPatients } = useGetPatientsQuery({
    locationId: data?.id
  })

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const patients: PatientViewModel[] = useMemo(() => {
    if (!patientsData?.patients) return []

    return patientsData.patients.map(p => ({
      id: p.id,
      name: p.name,
      firstname: p.firstname,
      lastname: p.lastname,
      birthdate: new Date(p.birthdate),
      sex: p.sex,
      location: p.assignedLocation?.parent?.title,
      subLocation: p.assignedLocation?.title,
      locationId: p.assignedLocation?.id,
      openTasksCount: p.tasks?.filter(t => !t.done).length ?? 0,
      tasks: []
    }))
  }, [patientsData])

  const patientColumns = useMemo<ColumnDef<PatientViewModel>[]>(() => [
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
        const color = sex === Sex.Male ? '!gender-male' : sex === Sex.Female ? '!gender-female' : '!gender-neutral'

        const label = {
          [Sex.Male]: translation('male'),
          [Sex.Female]: translation('female'),
          [Sex.Unknown]: translation('diverse'),
        }[sex] || sex

        return (
          <Chip color="none" size="small" className={color}>
            <span>{label}</span>
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
        return (
          <SmartDate date={row.original.birthdate} showTime={false}/>
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
          onClick={() => setSelectedPatientId(row.original.id)}
        >
          <EditIcon/>
        </Button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 77,
      minSize: 77,
      maxSize: 77
    }
  ], [translation])

  const { data: tasksData, refetch: refetchTasks } = useGetMyTasksQuery()
  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: () => refetchTasks() })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: () => refetchTasks() })

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!tasksData?.me?.tasks) return []

    return tasksData.me.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      description: task.description || undefined,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      done: task.done,
      patient: task.patient
        ? { id: task.patient.id, name: task.patient.name }
        : undefined,
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl }
        : undefined,
      room: task.patient?.assignedLocation
        ? { name: task.patient.assignedLocation.title }
        : undefined,
      ward: task.patient?.assignedLocation?.parent
        ? { name: task.patient.assignedLocation.parent.title }
        : undefined,
    }))
  }, [tasksData])

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const currentUserId = tasksData?.me?.id

  const tasksColumns = useMemo<ColumnDef<TaskViewModel>[]>(
    () => [
      {
        id: 'done',
        header: translation('status'),
        accessorKey: 'done',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <CheckboxUncontrolled
              checked={row.original.done}
              onCheckedChange={(checked) => {
                if (!checked) {
                  completeTask({ id: row.original.id })
                } else {
                  reopenTask({ id: row.original.id })
                }
              }}
              className={clsx('rounded-full')}
            />
          </div>
        ),
        minSize: 110,
        size: 110,
        maxSize: 110,
        enableResizing: false,
      },
      {
        id: 'title',
        header: translation('title'),
        cell: ({ row }) => {
          return (
            <Button
              color="neutral"
              coloringStyle="text"
              onClick={() => setSelectedTaskId(row.original.id)}
            >
              {row.original.name}
            </Button>
          )
        },
        accessorKey: 'name',
        minSize: 200,
        size: Number.MAX_SAFE_INTEGER,
      },
      {
        id: 'dueDate',
        header: translation('dueDate'),
        accessorKey: 'dueDate',
        cell: ({ row }) => {
          if (!row.original.dueDate) return <span className="text-description">-</span>
          return <SmartDate date={row.original.dueDate} mode="relative"/>
        },
        minSize: 150,
        size: 150,
        maxSize: 200,
      },
      {
        id: 'updateDate',
        header: 'Update Date',
        accessorKey: 'updateDate',
        cell: ({ row }) => (
          <SmartDate date={row.original.updateDate} mode="relative"/>
        ),
        minSize: 150,
        size: 150,
        maxSize: 200,
      },
      {
        id: 'patient',
        header: translation('patient'),
        accessorFn: ({ patient }) => patient?.name,
        cell: ({ row }) => {
          const data = row.original
          const hasAssignmentInfo = data.room || data.ward
          if (!data.patient) {
            return (
              <span className="text-description">
                {translation('noPatient')}
              </span>
            )
          }
          return (
            <div className="flex-col-0">
              <Button
                color="neutral"
                coloringStyle="text"
                size="none"
                onClick={() => {
                  setSelectedPatientId(row.original.patient?.id ?? null)
                }}
                className="flex-row-0 justify-start rounded-md px-1"
              >
                {data.patient?.name}
              </Button>
              <span className="text-description">
                {hasAssignmentInfo
                  ? [data.ward?.name, data.room?.name].filter(Boolean).join(' - ')
                  : translation('notAssigned')}
              </span>
            </div>
          )
        },
        sortingFn: 'text',
        minSize: 200,
        size: 250,
        maxSize: 350,
      },
      {
        id: 'assignee',
        header: translation('assignedTo'),
        accessorFn: ({ assignee }) => assignee?.name,
        cell: ({ row }) => {
          const assignee = row.original.assignee
          if (!assignee) {
            return (
              <span className="text-description">
                {translation('notAssigned')}
              </span>
            )
          }

          const isMe = assignee.id === currentUserId

          return (
            <div className={clsx('flex-row-2 items-center', { 'font-bold text-primary': isMe })}>
              <Avatar
                fullyRounded={true}
                image={{
                  avatarUrl: assignee.avatarURL || 'https://cdn.helpwave.de/boringavatar.svg',
                  alt: assignee.name
                }}
              />
              <span>
                {isMe ? `${translation('itsYou')} (${assignee.name})` : assignee.name}
              </span>
            </div>
          )
        },
        minSize: 200,
        size: 250,
        maxSize: 350,
      }
    ],
    [translation, currentUserId, completeTask, reopenTask]
  )

  return (
    <Page pageTitle={titleWrapper(translation('wards'))}>
      <ContentPanel
        titleElement={data?.name ?? (<LoadingContainer className="w-16 h-7"/>)}
        description={!data?.patients ?
          (<LoadingContainer className="w-32 h-4 mt-0.25"/>)
          : translation('nCurrentlyPatients', { count: data.patients?.length })}
      >
        {isLoading && (
          <LoadingContainer className="flex-col-0 grow"/>
        )}
        {!isLoading && isError && (
          <div className="bg-negative/20 flex-col-0 justify-center items-center">
            {translation('errorOccurred')}
          </div>
        )}
        {!isLoading && !isError && (
          <TabView>
            <Tab label={translation('tasks')}>
              <Table
                className="w-full h-full"
                data={tasks}
                columns={tasksColumns}
                fillerRow={() => (<FillerRowElement className="min-h-12"/>)}
              />
            </Tab>
            <Tab label={translation('patients')}>
              <Table
                className="w-full h-full"
                data={patients}
                columns={patientColumns}
                fillerRow={() => (<FillerRowElement className="min-h-12"/>)}
              />
            </Tab>
          </TabView>
        )}
      </ContentPanel>
      <SidePanel
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        title={translation('editPatient')}
      >
        {selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            onClose={() => setSelectedPatientId(null)}
            onSuccess={refetchPatients}
          />
        )}
      </SidePanel>
      <SidePanel
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        title={translation('editTask')}
      >
        {selectedTaskId && (
          <TaskDetailView
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            onSuccess={refetchTasks}
          />
        )}
      </SidePanel>
    </Page>
  )
}

export default WardPage
