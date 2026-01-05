import { Dialog, Button } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

interface ErrorDialogProps {
  isOpen: boolean,
  onClose: () => void,
  message?: string,
  title?: string,
}

export const ErrorDialog = ({
  isOpen,
  onClose,
  message,
  title,
}: ErrorDialogProps) => {
  const translation = useTasksTranslation()

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement={title || translation('error') || 'Error'}
      description={message || translation('errorOccurred') || 'An error occurred while saving changes.'}
    >
      <div className="flex-row-2 justify-end mt-4">
        <Button
          color="primary"
          onClick={onClose}
        >
          {translation('ok') || 'OK'}
        </Button>
      </div>
    </Dialog>
  )
}

