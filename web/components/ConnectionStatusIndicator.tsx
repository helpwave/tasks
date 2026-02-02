import type { ReactElement } from 'react'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { Tooltip, Button } from '@helpwave/hightide'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export function ConnectionStatusIndicator(): ReactElement {
  const status = useConnectionStatus()
  const translation = useTasksTranslation()

  const tooltip =
    status === 'connected'
      ? translation('connectionConnected') ?? 'Connected'
      : status === 'connecting'
        ? translation('connectionConnecting') ?? 'Connecting…'
        : translation('connectionDisconnected') ?? 'Disconnected'

  return (
    <Tooltip tooltip={tooltip} position="bottom">
      <Button
        coloringStyle="text"
        layout="icon"
        color="neutral"
        className="pointer-events-none"
        aria-label={tooltip}
      >
        {status === 'connected' && (
          <Wifi className="size-5 text-positive" aria-hidden />
        )}
        {status === 'connecting' && (
          <Loader2 className="size-5 animate-spin text-warning" aria-hidden />
        )}
        {status === 'disconnected' && (
          <WifiOff className="size-5 text-negative" aria-hidden />
        )}
      </Button>
    </Tooltip>
  )
}
