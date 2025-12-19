import { useEffect } from 'react'
import { Button, Menu, MenuItem } from '@helpwave/hightide'
import { Bell } from 'lucide-react'
import { useGetOverviewDataQuery } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { SmartDate } from '@/utils/date'

export const NotificationBell = () => {
  const translation = useTasksTranslation()
  const { data, refetch } = useGetOverviewDataQuery(undefined, {
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)
    return () => clearInterval(interval)
  }, [refetch])

  const recentPatients = data?.recentPatients?.slice(0, 5) || []
  const recentTasks = data?.recentTasks?.slice(0, 5) || []
  const hasNotifications = recentPatients.length > 0 || recentTasks.length > 0
  const notificationCount = recentPatients.length + recentTasks.length

  return (
    <Menu<HTMLButtonElement>
      trigger={(bag, ref) => (
        <Button
          ref={ref}
          coloringStyle="text"
          layout="icon"
          color="neutral"
          onClick={bag.toggleOpen}
          className="relative"
        >
          <Bell className="size-5" />
          {hasNotifications && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
      )}
    >
      <div className="max-h-96 overflow-y-auto w-80">
        {recentPatients.length > 0 && (
          <div className="px-4 py-2 border-b border-divider">
            <div className="typography-label-lg font-semibold">
              {translation('recentPatients') || 'Recent Patients'}
            </div>
          </div>
        )}
        {recentPatients.map((patient) => (
          <MenuItem key={patient.id}>
            <div className="flex-col-1">
              <span className="typography-body-sm font-medium">{patient.name}</span>
              <span className="typography-body-xs text-description">
                {translation('updated') || 'Updated'} {patient.tasks?.[0]?.updateDate && (
                  <SmartDate date={new Date(patient.tasks[0].updateDate)} showTime={true} />
                )}
              </span>
            </div>
          </MenuItem>
        ))}
        {recentTasks.length > 0 && (
          <div className="px-4 py-2 border-b border-divider">
            <div className="typography-label-lg font-semibold">
              {translation('recentTasks') || 'Recent Tasks'}
            </div>
          </div>
        )}
        {recentTasks.map((task) => (
          <MenuItem key={task.id}>
            <div className="flex-col-1">
              <span className="typography-body-sm font-medium">{task.title}</span>
              <span className="typography-body-xs text-description">
                {task.patient?.name} • {task.updateDate && (
                  <SmartDate date={new Date(task.updateDate)} showTime={true} />
                )}
              </span>
            </div>
          </MenuItem>
        ))}
        {!hasNotifications && (
          <div className="px-4 py-8 text-center text-description">
            {translation('noNotifications') || 'No recent updates'}
          </div>
        )}
      </div>
    </Menu>
  )
}

