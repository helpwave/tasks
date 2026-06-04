import { Dialog, Button } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

interface SessionExpiredDialogProps {
  isOpen: boolean,
  onLogin: () => void,
}

/**
 * A blocking dialog that informs the user their session has expired (e.g. due to
 * inactivity) and that they need to log in again before they can continue working.
 *
 * Without this the app would keep showing the last screen while silently rejecting
 * any changes, leaving users unsure whether they were still logged in (see issue #97).
 */
export const SessionExpiredDialog = ({
  isOpen,
  onLogin,
}: SessionExpiredDialogProps) => {
  const translation = useTasksTranslation()

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onLogin}
      titleElement={translation('sessionExpired')}
      description={translation('sessionExpiredDescription')}
    >
      <div className="flex-row-2 justify-end mt-4">
        <Button
          color="primary"
          onClick={onLogin}
        >
          {translation('logInAgain')}
        </Button>
      </div>
    </Dialog>
  )
}
