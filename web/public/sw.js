self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data } = event.data
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag,
        data,
        badge: '/favicon.ico',
        requireInteraction: false,
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0]
        if (notificationData?.url) {
          return client.navigate(notificationData.url).then(() => client.focus())
        }
        return client.focus()
      }
      if (self.clients.openWindow && notificationData?.url) {
        return self.clients.openWindow(notificationData.url)
      }
    })
  )
})

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json()
      const { title, body, icon, tag, data } = payload
      event.waitUntil(
        self.registration.showNotification(title, {
          body,
          icon: icon || '/favicon.ico',
          tag,
          data,
          badge: '/favicon.ico',
          requireInteraction: false,
        })
      )
    } catch {
      void 0
    }
  }
})

