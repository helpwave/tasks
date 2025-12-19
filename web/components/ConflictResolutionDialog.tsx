import { Dialog, Button } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

interface ConflictResolutionDialogProps {
  isOpen: boolean,
  onClose: () => void,
  onResolve: () => void,
  message: string,
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
      titleElement={translation('conflictDetected') || 'Conflict Detected'}
      description={message}
    >
      <div className="flex-row-2 justify-end mt-4">
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
    </Dialog>
  )
}

