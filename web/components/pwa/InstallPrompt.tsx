import { useEffect, useState } from 'react'
import { Button, Dialog } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Download } from 'lucide-react'
import clsx from 'clsx'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>,
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>,
}

export const InstallPrompt = () => {
  const translation = useTasksTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.matchMedia('(max-width: 768px)').matches ||
                            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
      return isMobileDevice
    }

    const isMobileDevice = checkMobile()
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleMediaChange = () => checkMobile()
    mediaQuery.addEventListener('change', handleMediaChange)

    if (!isMobileDevice) {
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange)
      }
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange)
      }
    }

    const installed = localStorage.getItem('pwa-installed')
    if (installed === 'true') {
      setIsInstalled(true)
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange)
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsOpen(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsOpen(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
      localStorage.setItem('pwa-installed', 'true')
    }

    setDeferredPrompt(null)
    setIsOpen(false)
  }

  const handleDismiss = () => {
    setIsOpen(false)
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!isMobile || isInstalled || !isOpen || sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
    return null
  }

  return (
    <Dialog
      isModal={false}
      isOpen={isOpen}
      onClose={handleDismiss}
      titleElement={translation('installApp')}
      description={translation('installAppDescription')}
      className={clsx('z-20 w-96')}
      backgroundClassName="z-10"
    >
      <div className="flex-row-0 justify-end gap-2">
        <Button color="neutral" coloringStyle="outline" onClick={handleDismiss}>
          {translation('dismiss')}
        </Button>
        <Button color="positive" onClick={handleInstall}>
          <Download className="size-4" />
          {translation('install')}
        </Button>
      </div>
    </Dialog>
  )
}

