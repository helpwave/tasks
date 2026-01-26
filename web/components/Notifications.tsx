import { useEffect, useMemo } from 'react'
import { Button, Chip, PopUp, PopUpContext, PopUpOpener, PopUpRoot, Tooltip, useLocalStorage, Visibility } from '@helpwave/hightide'
import { Bell } from 'lucide-react'
import { useGetOverviewDataQuery } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { SmartDate } from '@/utils/date'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'

type NotificationItem = {
  id: string,
  type: 'patient' | 'task',
  title: string,
  subtitle: string,
  date: Date | null,
  patientId?: string,
  taskId?: string,
}

export const Notifications = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { user } = useTasksContext()
  const { data, refetch } = useGetOverviewDataQuery(undefined, {
    refetchOnWindowFocus: true,
  })

  const {
    value: readNotificationsRaw,
    setValue: setReadNotificationsRaw
  } = useLocalStorage<string[]>('read-notifications', [])

  const {
    value: dismissedNotificationsRaw,
    setValue: setDismissedNotificationsRaw
  } = useLocalStorage<string[]>('dismissed-notifications', [])

  const readNotifications = useMemo(() => {
    return new Set(readNotificationsRaw || [])
  }, [readNotificationsRaw])

  const dismissedNotifications = useMemo(() => {
    return new Set(dismissedNotificationsRaw || [])
  }, [dismissedNotificationsRaw])

  const setReadNotifications = (newSet: Set<string>) => {
    setReadNotificationsRaw(Array.from(newSet))
  }

  const setDismissedNotifications = (newSet: Set<string>) => {
    setDismissedNotificationsRaw(Array.from(newSet))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)
    return () => clearInterval(interval)
  }, [refetch])

  const notifications: NotificationItem[] = useMemo(() => {
    const items: NotificationItem[] = []

    const recentPatients = data?.recentPatients?.slice(0, 5) || []
    recentPatients.forEach((patient) => {
      const updateDate = patient.tasks?.[0]?.updateDate
      const id = `patient-${patient.id}`
      if (!dismissedNotifications.has(id)) {
        items.push({
          id,
          type: 'patient',
          title: patient.name,
          subtitle: translation('patient') || 'Patient',
          date: updateDate ? new Date(updateDate) : null,
          patientId: patient.id,
        })
      }
    })

    const recentTasks = data?.recentTasks?.slice(0, 5) || []
    recentTasks.forEach((task) => {
      if (task.assignee?.id === user?.id) {
        return
      }
      const id = `task-${task.id}`
      if (!dismissedNotifications.has(id)) {
        items.push({
          id,
          type: 'task',
          title: task.title,
          subtitle: task.patient?.name || translation('task') || 'Task',
          date: task.updateDate ? new Date(task.updateDate) : null,
          taskId: task.id,
          patientId: task.patient?.id,
        })
      }
    })

    return items.sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return b.date.getTime() - a.date.getTime()
    })
  }, [data, translation, dismissedNotifications, user])

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readNotifications.has(n.id)).length
  }, [notifications, readNotifications])

  const handleNotificationClick = (notification: NotificationItem) => {
    const newReadSet = new Set(readNotifications)
    newReadSet.add(notification.id)
    setReadNotifications(newReadSet)

    if (notification.type === 'patient' && notification.patientId) {
      router.push(`/patients?patientId=${notification.patientId}`)
    } else if (notification.type === 'task' && notification.taskId) {
      router.push(`/tasks?taskId=${notification.taskId}`)
    }
  }

  const handleDismissAll = () => {
    const allIds = notifications.map(n => n.id)
    const newDismissedSet = new Set(dismissedNotifications)
    allIds.forEach(id => newDismissedSet.add(id))
    setDismissedNotifications(newDismissedSet)

    const newReadSet = new Set(readNotifications)
    allIds.forEach(id => newReadSet.add(id))
    setReadNotifications(newReadSet)
  }

  return (
    <PopUpRoot>
      <PopUpContext.Consumer>
        {({ isOpen }) => (
          <Tooltip tooltip={translation('notifications')} disabled={isOpen}>
            <PopUpOpener>
              {({ props }) => (
                <Button
                  {...props}
                  coloringStyle="text"
                  layout="icon"
                  color="neutral"
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex-row-0 min-w-4.5 h-4.5 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              )}
            </PopUpOpener>
          </Tooltip>
        )}
      </PopUpContext.Consumer>
      <PopUp
        options={{
          horizontalAlignment: 'center'
        }}
        className="p-2"
      >
        <div className="flex-row-2 justify-between items-center">
          <span className="typography-label-lg font-semibold">
            {translation('notifications') || 'Notifications'}
          </span>
          <Button
            size="sm"
            coloringStyle="text"
            color="neutral"
            onClick={() => handleDismissAll()}
            className="text-nowrap"
            disabled={notifications.length === 0}
          >
            {translation('dismissAll') || 'Dismiss All'}
          </Button>
        </div>
        <Visibility isVisible={notifications.length === 0}>
          <div className="px-4 py-8 text-center text-description">
            {translation('noNotifications') || 'No recent updates'}
          </div>
        </Visibility>
        <Visibility isVisible={notifications.length > 0}>
          {notifications.map((notification) => {
            const isRead = readNotifications.has(notification.id)
            return (
              <PopUpContext.Consumer key={notification.id}>
                {({ setIsOpen }) => (
                  <div
                    onClick={() => {
                      handleNotificationClick(notification)
                      setIsOpen(false)
                    }}
                    className={`block px-3 py-1.5 text-sm font-semibold text-nowrap text-left cursor-pointer hover:bg-primary/20 ${isRead ? 'opacity-60' : ''} border-b last:border-b-0 border-divider last:rounded-b-md`}
                  >
                    <div className="flex-row-2 items-start w-full">
                      <div className="flex-col-1 flex-1 min-w-0">
                        <div className="flex-row-2 items-center gap-2">
                          <Chip
                            size="xs"
                            color={notification.type === 'patient' ? 'primary' : 'neutral'}
                          >
                            {notification.type === 'patient'
                              ? (translation('patient') || 'Patient')
                              : (translation('task') || 'Task')}
                          </Chip>
                          <span className="typography-body-sm font-medium truncate">{notification.title}</span>
                        </div>
                        <span className="typography-body-xs text-description truncate">
                          {notification.subtitle}
                          {notification.date && (
                            <> • <SmartDate date={notification.date} showTime={true} /></>
                          )}
                        </span>
                      </div>
                      {!isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                )}
              </PopUpContext.Consumer>
            )
          })}
        </Visibility>
      </PopUp>
    </PopUpRoot>
  )
}

