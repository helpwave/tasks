import { Dialog, Button } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

interface ConflictResolutionDialogProps {
  isOpen: boolean
  onClose: () => void
  onResolve: () => void
  message: string
}

export const ConflictResolutionDialog = ({
  isOpen,
  onClose,
  onResolve,
  message
}: ConflictResolutionDialogProps) => {
  const translation = useTasksTranslation()

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={translation('conflictDetected') || 'Conflict Detected'}
    >
      <div className="flex-col-4">
        <p>{message}</p>
        <div className="flex-row-2 justify-end">
          <Button
            color="neutral"
            coloringStyle="outline"
            onClick={onClose}
          >
            {translation('cancel') || 'Cancel'}
          </Button>
          <Button
            color="primary"
            onClick={onResolve}
          >
            {translation('overwrite') || 'Overwrite'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

