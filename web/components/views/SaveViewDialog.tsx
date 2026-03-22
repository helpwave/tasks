'use client'

import { useCallback, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Button, Dialog, Input } from '@helpwave/hightide'
import type {
  SavedViewEntityType } from '@/api/gql/generated'
import {
  CreateSavedViewDocument,
  MySavedViewsDocument,
  type CreateSavedViewMutation,
  type CreateSavedViewMutationVariables,
  SavedViewVisibility
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type SaveViewDialogProps = {
  isOpen: boolean,
  onClose: () => void,
  /** Entity this view is saved from */
  baseEntityType: SavedViewEntityType,
  filterDefinition: string,
  sortDefinition: string,
  parameters: string,
  presentation?: 'default' | 'fromSystemList',
  /** Optional: navigate or toast after save */
  onCreated?: (id: string) => void,
}

export function SaveViewDialog({
  isOpen,
  onClose,
  baseEntityType,
  filterDefinition,
  sortDefinition,
  parameters,
  presentation = 'default',
  onCreated,
}: SaveViewDialogProps) {
  const translation = useTasksTranslation()
  const [name, setName] = useState('')

  const handleClose = useCallback(() => {
    onClose()
    setName('')
  }, [onClose])

  const [createSavedView, { loading }] = useMutation<
    CreateSavedViewMutation,
    CreateSavedViewMutationVariables
  >(getParsedDocument(CreateSavedViewDocument), {
    refetchQueries: [{ query: getParsedDocument(MySavedViewsDocument) }],
    onCompleted(data) {
      onCreated?.(data?.createSavedView?.id)
      handleClose()
    },
  })

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      titleElement={presentation === 'fromSystemList' ? translation('saveViewAsNew') : translation('saveView')}
      description={presentation === 'fromSystemList' ? translation('saveViewDescriptionFromSystemList') : translation('saveViewDescription')}
    >
      <div className="flex-col-4">
        <div className="flex flex-col gap-1">
          <label>{translation('name')}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex-row-2 justify-end">
          <Button
            color="neutral"
            onClick={handleClose}
          >
            {translation('cancel')}
          </Button>
          <Button
            disabled={name.trim().length < 2 || loading}
            color="primary"
            onClick={() => {
              createSavedView({
                variables: {
                  data: {
                    name: name.trim(),
                    baseEntityType,
                    filterDefinition,
                    sortDefinition,
                    parameters,
                    visibility: SavedViewVisibility.Private,
                  },
                },
              })
            }}
          >
            {translation('add')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
