export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    return registration
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

export async function showNotification(
  registration: ServiceWorkerRegistration | null,
  title: string,
  options: NotificationOptions & { body: string, tag?: string, data?: unknown }
): Promise<void> {
  if (!registration) {
    if (Notification.permission === 'granted') {
      new Notification(title, options)
    }
    return
  }

  if (Notification.permission === 'granted') {
    await registration.showNotification(title, {
      ...options,
      badge: '/favicon.ico',
      requireInteraction: false,
    })
  }
}

export function createNotificationForPatientCreated(patientName: string, patientId: string): {
  title: string,
  body: string,
  tag: string,
  data: { url: string, type: string, id: string },
} {
  return {
    title: 'New Patient',
    body: `New patient: ${patientName}`,
    tag: `patient-created-${patientId}`,
    data: {
      url: `/patients?patientId=${patientId}`,
      type: 'patient_created',
      id: patientId,
    },
  }
}

export function createNotificationForPatientUpdated(patientName: string, patientId: string): {
  title: string,
  body: string,
  tag: string,
  data: { url: string, type: string, id: string },
} {
  return {
    title: 'Patient Updated',
    body: `Patient ${patientName} updated`,
    tag: `patient-updated-${patientId}`,
    data: {
      url: `/patients?patientId=${patientId}`,
      type: 'patient_updated',
      id: patientId,
    },
  }
}

export function createNotificationForTaskCreated(taskTitle: string, taskId: string): {
  title: string,
  body: string,
  tag: string,
  data: { url: string, type: string, id: string },
} {
  return {
    title: 'New Task',
    body: `New task: ${taskTitle}`,
    tag: `task-created-${taskId}`,
    data: {
      url: `/tasks?taskId=${taskId}`,
      type: 'task_created',
      id: taskId,
    },
  }
}

export function createNotificationForTaskCompleted(taskTitle: string, taskId: string): {
  title: string,
  body: string,
  tag: string,
  data: { url: string, type: string, id: string },
} {
  return {
    title: 'Task Completed',
    body: `Task ${taskTitle} completed`,
    tag: `task-completed-${taskId}`,
    data: {
      url: `/tasks?taskId=${taskId}`,
      type: 'task_completed',
      id: taskId,
    },
  }
}

