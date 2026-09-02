'use client'

import { useCallback, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Button, Dialog, Input } from '@helpwave/hightide'
import type {
  SavedViewEntityType } from '@/api/gql/generated'
import {
  CreateSavedViewDocument,
  type CreateSavedViewMutation,
  type CreateSavedViewMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { appendSavedViewToMySavedViewsCache } from '@/utils/savedViewsCache'
import {
  isScopeComplete,
  privateScope,
  ScopeVisibilityField,
  scopeToInput,
  type ScopeValue
} from '@/components/locations/ScopeVisibilityField'

type SaveViewDialogProps = {
  isOpen: boolean,
  onClose: () => void,
  baseEntityType: SavedViewEntityType,
  filterDefinition: string,
  sortDefinition: string,
  parameters: string,
  presentation?: 'default' | 'fromSystemList',
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
  const [scope, setScope] = useState<ScopeValue>(privateScope)

  const handleClose = useCallback(() => {
    onClose()
    setName('')
    setScope(privateScope())
  }, [onClose])

  const [createSavedView, { loading }] = useMutation<
    CreateSavedViewMutation,
    CreateSavedViewMutationVariables
  >(getParsedDocument(CreateSavedViewDocument), {
    refetchQueries: ['MySavedViews'],
    awaitRefetchQueries: true,
    update(cache, { data }) {
      const view = data?.createSavedView
      if (view) {
        appendSavedViewToMySavedViewsCache(cache, view)
      }
    },
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
        <ScopeVisibilityField value={scope} onChange={setScope} />
        <div className="flex-row-2 justify-end">
          <Button
            color="neutral"
            onClick={handleClose}
          >
            {translation('cancel')}
          </Button>
          <Button
            disabled={name.trim().length < 2 || loading || !isScopeComplete(scope)}
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
                    ...scopeToInput(scope),
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
