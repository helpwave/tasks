import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, Input } from '@helpwave/hightide'

type ClearPropertyColumnDialogProps = {
  isOpen: boolean,
  title: string,
  description: string,
  instructionLabel: string,
  confirmLabel: string,
  cancelLabel: string,
  propertyName: string,
  isSubmitting: boolean,
  processedCount: number,
  affectedCount: number,
  errorMessage: string | null,
  onClose: () => void,
  onConfirm: () => void,
}

export function ClearPropertyColumnDialog({
  isOpen,
  title,
  description,
  instructionLabel,
  confirmLabel,
  cancelLabel,
  propertyName,
  isSubmitting,
  processedCount,
  affectedCount,
  errorMessage,
  onClose,
  onConfirm,
}: ClearPropertyColumnDialogProps) {
  const [typedName, setTypedName] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setTypedName('')
    }
  }, [isOpen])

  const isMatch = useMemo(
    () => typedName.trim() === propertyName.trim(),
    [typedName, propertyName]
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement={title}
      description={description}
    >
      <div className="flex-col-3">
        <div className="flex-col-1">
          <span className="typography-label-sm text-description">
            {instructionLabel}
          </span>
          <Input value={typedName} onChange={(event) => setTypedName(event.target.value)} />
        </div>
        {isSubmitting && (
          <span className="typography-label-sm text-description">
            {`${processedCount}/${affectedCount}`}
          </span>
        )}
        {errorMessage && (
          <span className="typography-label-sm text-negative">{errorMessage}</span>
        )}
        <div className="flex-row-2 justify-end">
          <Button color="neutral" onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button
            color="negative"
            onClick={onConfirm}
            disabled={!isMatch || isSubmitting}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
