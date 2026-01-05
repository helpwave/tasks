import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useGetOverviewDataQuery } from '@/api/gql/generated'
import { Avatar, Button, CheckboxUncontrolled, FillerRowElement, Table } from '@helpwave/hightide'
import { CurrentTime, SmartDate } from '@/utils/date'
import { ClockIcon, ListCheckIcon, UsersIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { useTasksContext } from '@/hooks/useTasksContext'
import Link from 'next/link'
import { SidePanel } from '@/components/layout/SidePanel'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { LocationChips } from '@/components/patients/LocationChips'
import { useCompleteTaskMutation, useReopenTaskMutation } from '@/api/gql/generated'
import clsx from 'clsx'

const isOverdue = (dueDate: Date | undefined | null, done: boolean): boolean => {
  if (!dueDate || done) return false
  return new Date(dueDate).getTime() < Date.now()
}

const isCloseToDueDate = (dueDate: Date | undefined | null, done: boolean): boolean => {
  if (!dueDate || done) return false
  const now = Date.now()
  const dueTime = new Date(dueDate).getTime()
  const oneHour = 60 * 60 * 1000
  return dueTime > now && dueTime - now <= oneHour
}

const getGreetingKey = (): string => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'dashboardWelcomeMorning'
  if (hour >= 12 && hour < 14) return 'dashboardWelcomeNoon'
  if (hour >= 14 && hour < 18) return 'dashboardWelcomeAfternoon'
  if (hour >= 18 && hour < 23) return 'dashboardWelcomeEvening'
  return 'dashboardWelcomeNight'
}

const Dashboard: NextPage = () => {
  const translation = useTasksTranslation()
  const { user, myTasksCount, totalPatientsCount } = useTasksContext()
  const { data } = useGetOverviewDataQuery(undefined, {})

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { mutate: completeTask } = useCompleteTaskMutation({})
  const { mutate: reopenTask } = useReopenTaskMutation({})

  const recentPatients = useMemo(() => data?.recentPatients ?? [], [data])
  const recentTasks = useMemo(() => data?.recentTasks ?? [], [data])

  const taskColumns = useMemo<ColumnDef<typeof recentTasks[0]>[]>(() => [
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
      header: translation('task'),
      accessorKey: 'title',
      cell: ({ row }) => {
        return row.original.title
      },
      minSize: 200,
    },
    {
      id: 'patient',
      header: translation('patient'),
      accessorKey: 'patient',
      cell: ({ row }) => {
        const patient = row.original.patient
        if (!patient) return <span>-</span>

        return (
          <Button
            color="neutral"
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedPatientId(patient.id)
            }}
            className="flex-row-0 justify-start w-fit"
          >
            {patient.name}
          </Button>
        )
      },
      minSize: 150,
    },
    {
      id: 'dueDate',
      header: translation('dueDate'),
      accessorKey: 'dueDate',
      cell: ({ row }) => {
        if (!row.original.dueDate) return <span className="text-description">-</span>
        const overdue = isOverdue(row.original.dueDate, row.original.done)
        const closeToDue = isCloseToDueDate(row.original.dueDate, row.original.done)
        let colorClass = ''
        if (overdue) {
          colorClass = '!text-red-500'
        } else if (closeToDue) {
          colorClass = '!text-orange-500'
        }
        return (
          <SmartDate
            date={new Date(row.original.dueDate)}
            mode="relative"
            className={clsx(colorClass)}
          />
        )
      },
      minSize: 150,
      size: 150,
      maxSize: 200,
    },
    {
      id: 'date',
      header: translation('updated'),
      cell: ({ row }) => (
        <SmartDate date={row.original.updateDate ? new Date(row.original.updateDate) : new Date()}/>
      ),
      minSize: 100,
    }
  ], [translation, completeTask, reopenTask])

  const patientColumns = useMemo<ColumnDef<typeof recentPatients[0]>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 150,
    },
    {
      id: 'location',
      header: translation('location'),
      accessorKey: 'position',
      cell: ({ row }) => (
        <LocationChips locations={row.original.position ? [row.original.position] : []} small />
      ),
      minSize: 150,
    },
    {
      id: 'updated',
      header: translation('updated'),
      accessorKey: 'tasks',
      cell: ({ row }) => {
        const tasks = row.original.tasks || []
        const updateDates = tasks
          .map(t => t.updateDate ? new Date(t.updateDate) : null)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime())

        const mostRecentDate = updateDates[0]
        if (!mostRecentDate) return <span className="text-description">-</span>

        return <SmartDate date={mostRecentDate} />
      },
      minSize: 100,
    }
  ], [translation])

  return (
    <Page pageTitle={titleWrapper(translation('homePage'))}>
      <div className="flex-col-8 p-4">
        <div className="flex-row-4 items-center">
          <Avatar
            size="lg"
            fullyRounded
            image={user?.avatarUrl ? { avatarUrl: user.avatarUrl, alt: user.name } : undefined}
          />
          <div className="flex-col-1">
            <h1 className="typography-title-lg">{translation(getGreetingKey() as 'dashboardWelcomeMorning' | 'dashboardWelcomeNoon' | 'dashboardWelcomeAfternoon' | 'dashboardWelcomeEvening' | 'dashboardWelcomeNight', { name: user?.name ?? '' })}</h1>
            <p className="typography-body text-description">{translation('dashboardWelcomeDescription')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4">

          <Link href="/tasks" className="min-w-[200px] min-h-[80px] flex-1 w-full sm:w-auto">
            <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border h-full">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <ListCheckIcon size={24}/>
              </div>
              <div className="flex-col-0">
                <span className="typography-label-sm text-description">{translation('myOpenTasks')}</span>
                <span className="typography-title-lg">{myTasksCount}</span>
              </div>
            </div>
          </Link>

          <Link href="/patients" className="min-w-[200px] min-h-[80px] flex-1 w-full sm:w-auto">
            <div className="bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border h-full">
              <div className="p-3 bg-green-500/10 rounded-full text-green-600">
                <UsersIcon size={24}/>
              </div>
              <div className="flex-col-0">
                <span className="typography-label-sm text-description">{translation('totalPatients')}</span>
                <span className="typography-title-lg">{totalPatientsCount}</span>
              </div>
            </div>
          </Link>

          <div className="min-w-[200px] min-h-[80px] flex-1 w-full sm:w-auto bg-surface rounded-lg p-4 shadow-sm flex-row-4 items-center border border-border">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
              <ClockIcon size={24}/>
            </div>
            <div className="flex-col-0">
              <span className="typography-label-sm text-description">{translation('currentTime')}</span>
              <span className="typography-title-lg">
                <CurrentTime/>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 mt-4">
          <ContentPanel titleElement={translation('recentTasks')} description={translation('tasksUpdatedRecently')} className="xl:w-[calc(60%-14.4px)] flex-shrink-0">
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <Table
                className="cursor-pointer w-full"
                data={recentTasks}
                columns={taskColumns}
                fillerRow={() => (<FillerRowElement className="min-h-6"/>)}
                onRowClick={(row) => setSelectedTaskId(row.original.id)}
              />
            </div>
          </ContentPanel>

          <ContentPanel titleElement={translation('recentPatients')} description={translation('patientsUpdatedRecently')} className="xl:w-[calc(40%-9.6px)] flex-shrink-0">
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <Table
                className="cursor-pointer w-full"
                data={recentPatients}
                columns={patientColumns}
                fillerRow={() => (<FillerRowElement className="min-h-6"/>)}
                onRowClick={(row) => setSelectedPatientId(row.original.id)}
              />
            </div>
          </ContentPanel>
        </div>

        <SidePanel
          title={translation('editPatient')}
          isOpen={!!selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        >
          {selectedPatientId && (
            <PatientDetailView
              patientId={selectedPatientId}
              onClose={() => setSelectedPatientId(null)}
              onSuccess={() => {}}
            />
          )}
        </SidePanel>

        <SidePanel
          title={translation('editTask')}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        >
          {selectedTaskId && (
            <TaskDetailView
              taskId={selectedTaskId}
              onClose={() => setSelectedTaskId(null)}
              onSuccess={() => {}}
            />
          )}
        </SidePanel>

      </div>
    </Page>
  )
}

export default Dashboard
