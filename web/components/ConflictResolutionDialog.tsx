import React, { useState } from 'react'
import { Dialog, Button } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export type ConflictResolutionChoice = 'keep-local' | 'use-server' | 'merge'

interface ConflictField {
  field: string,
  localValue: unknown,
  serverValue: unknown,
}

interface ConflictResolutionDialogProps {
  isOpen: boolean,
  onClose: () => void,
  onResolve: (choice: ConflictResolutionChoice) => void,
  message: string,
  fields?: ConflictField[],
  localData?: Record<string, unknown>,
  serverData?: Record<string, unknown>,
}

export const ConflictResolutionDialog = ({
  isOpen,
  onClose,
  onResolve,
  message,
  fields = [],
  localData,
  serverData,
}: ConflictResolutionDialogProps) => {
  const translation = useTasksTranslation()
  const [selectedChoice, setSelectedChoice] = useState<ConflictResolutionChoice | null>(null)

  const handleResolve = (choice: ConflictResolutionChoice) => {
    setSelectedChoice(choice)
    onResolve(choice)
  }

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  const detectedFields = fields.length > 0
    ? fields
    : localData && serverData
      ? Object.keys({ ...localData, ...serverData }).map(field => ({
          field,
          localValue: localData[field],
          serverValue: serverData[field],
        })).filter(f => JSON.stringify(f.localValue) !== JSON.stringify(f.serverValue))
      : []

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement={translation('conflictDetected') || 'Conflict Detected'}
      description={message}
    >
      <div className="flex-col-4 mt-4">
        {detectedFields.length > 0 && (
          <div className="flex-col-2 mb-4">
            <div className="text-sm font-semibold mb-2">
              Conflicting Fields:
            </div>
            <div className="border rounded-md p-2 max-h-64 overflow-y-auto">
              {detectedFields.map((field, index) => (
                <div key={index} className="flex-col-2 mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0">
                  <div className="font-medium text-sm">{field.field}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-primary font-semibold mb-1">
                        Your Changes:
                      </div>
                      <div className="bg-primary/10 p-2 rounded break-words">
                        {formatValue(field.localValue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-secondary font-semibold mb-1">
                        Server Value:
                      </div>
                      <div className="bg-secondary/10 p-2 rounded break-words">
                        {formatValue(field.serverValue)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-row-2 justify-end gap-2">
          <Button
            color="neutral"
            coloringStyle="outline"
            onClick={onClose}
          >
            {translation('cancel') || 'Cancel'}
          </Button>
          <Button
            color="neutral"
            coloringStyle="outline"
            onClick={() => handleResolve('keep-local')}
            disabled={selectedChoice !== null}
          >
            Keep Local
          </Button>
          <Button
            color="neutral"
            coloringStyle="outline"
            onClick={() => handleResolve('use-server')}
            disabled={selectedChoice !== null}
          >
            Use Server
          </Button>
          <Button
            color="primary"
            onClick={() => handleResolve('merge')}
            disabled={selectedChoice !== null}
          >
            Merge
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

