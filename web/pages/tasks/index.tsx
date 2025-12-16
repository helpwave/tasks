import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button, CheckboxUncontrolled, FillerRowElement, Table } from '@helpwave/hightide'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { useCompleteTaskMutation, useGetMyTasksQuery, useReopenTaskMutation } from '@/api/gql/generated'
import { PlusIcon } from 'lucide-react'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { SidePanel } from '@/components/layout/SidePanel'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { LocationChips } from '@/components/patients/LocationChips'

type TaskViewModel = {
  id: string,
  name: string,
  description?: string,
  updateDate: Date,
  dueDate?: Date,
  patient?: { id: string, name: string, locations: Array<{ id: string, title: string, parent?: { id: string, title: string, parent?: { id: string, title: string } | null } | null }> },
  assignee?: { id: string, name: string, avatarURL?: string | null },
  done: boolean,
}

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { data: queryData, refetch } = useGetMyTasksQuery()
  const { mutate: completeTask } = useCompleteTaskMutation({ onSuccess: () => refetch() })
  const { mutate: reopenTask } = useReopenTaskMutation({ onSuccess: () => refetch() })

  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskViewModel | null>(null)

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!queryData?.me?.tasks) return []

    return queryData.me.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      description: task.description || undefined,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      done: task.done,
      patient: task.patient
        ? {
          id: task.patient.id,
          name: task.patient.name,
          locations: task.patient.assignedLocations || []
        }
        : undefined,
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl }
        : undefined,
    }))
  }, [queryData])

  const handleCreate = () => {
    setSelectedTask(null)
    setIsTasksPanelOpen(true)
  }

  const selectTask = (task: TaskViewModel) => {
    setSelectedTask(task)
    setIsTasksPanelOpen(true)
  }

  const handleClosePanel = () => {
    setIsTasksPanelOpen(false)
    setTimeout(() => setSelectedTask(null), 300)
  }

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(
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
              onClick={() => selectTask(row.original)}
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
          return <SmartDate date={row.original.dueDate} mode="relative" />
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
          <SmartDate date={row.original.updateDate} mode="relative" />
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
          if (!data.patient) {
            return (
              <span className="text-description">
                {translation('noPatient')}
              </span>
            )
          }
          return (
            <div className="flex flex-col gap-1">
              <Button
                color="neutral"
                coloringStyle="text"
                size="none"
                onClick={() => {
                  setSelectedPatientId(data.patient?.id ?? null)
                }}
                className="flex-row-0 justify-start rounded-md px-1"
              >
                {data.patient?.name}
              </Button>
              <LocationChips locations={data.patient.locations || []} />
            </div>
          )
        },
        sortingFn: 'text',
        minSize: 200,
        size: 250,
        maxSize: 350,
      },
    ],
    [translation, completeTask, reopenTask]
  )

  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel
        titleElement={translation('myTasks')}
        description={translation('nTask', { count: tasks.length })}
        actionElement={(
          <Button startIcon={<PlusIcon />} onClick={handleCreate}>
            {translation('addTask')}
          </Button>
        )}
      >
        <Table
          className="w-full h-full"
          data={tasks}
          columns={columns}
          fillerRow={() => (
            <FillerRowElement className="min-h-12" />
          )}
          initialState={{
            sorting: [
              { id: 'done', desc: true },
              { id: 'updateDate', desc: true },
            ]
          }}
          enableMultiSort={true}
        />
      </ContentPanel>

      <SidePanel
        isOpen={isTasksPanelOpen}
        onClose={handleClosePanel}
      >
        {(isTasksPanelOpen || selectedTask) && (
          <TaskDetailView
            taskId={selectedTask?.id}
            onClose={handleClosePanel}
            onSuccess={refetch}
          />
        )}
      </SidePanel>
      <SidePanel
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      >
        {!!selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            onClose={() => setSelectedPatientId(null)}
            onSuccess={refetch}
          />
        )}
      </SidePanel>
    </Page>
  )
}

export default TasksPage
