'use client'

import type { NextPage } from 'next'
import { useCallback, useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useRouter } from 'next/router'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button, Checkbox, ConfirmDialog, Dialog, FillerCell, IconButton, Input, LoadingContainer, Table } from '@helpwave/hightide'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { SavedViewEntityTypeChip } from '@/components/views/SavedViewEntityTypeChip'
import { useMySavedViews } from '@/data'
import {
  DeleteSavedViewDocument,
  DuplicateSavedViewDocument,
  type DeleteSavedViewMutation,
  type DeleteSavedViewMutationVariables,
  type DuplicateSavedViewMutation,
  type DuplicateSavedViewMutationVariables,
  MySavedViewsDocument,
  SavedViewVisibility,
  UpdateSavedViewDocument,
  type UpdateSavedViewMutation,
  type UpdateSavedViewMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import {
  appendSavedViewToMySavedViewsCache,
  removeSavedViewFromMySavedViewsCache,
  replaceSavedViewInMySavedViewsCache
} from '@/utils/savedViewsCache'
import type { ColumnDef } from '@tanstack/table-core'
import { EditIcon, ExternalLink, Trash2, Share2, CopyPlus } from 'lucide-react'
import type { MySavedViewsQuery, SavedViewEntityType } from '@/api/gql/generated'

type SavedViewRowGql = MySavedViewsQuery['mySavedViews'][number]

type SavedViewRow = {
  id: string,
  name: string,
  baseEntityType: SavedViewEntityType,
  updatedAt: string,
  visibility: SavedViewVisibility,
}

const ViewsSettingsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { data, loading } = useMySavedViews()
  const rows: SavedViewRow[] = useMemo(() => {
    return (data?.mySavedViews ?? []).map((v: SavedViewRowGql) => ({
      id: v.id,
      name: v.name,
      baseEntityType: v.baseEntityType,
      updatedAt: v.updatedAt,
      visibility: v.visibility,
    }))
  }, [data])

  const fillerRowCell = useCallback(() => (<FillerCell className="min-h-12" />), [])

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)
  const [duplicateName, setDuplicateName] = useState('')

  const savedViewsRefetch = { query: getParsedDocument(MySavedViewsDocument) }
  const [updateSavedView] = useMutation<UpdateSavedViewMutation, UpdateSavedViewMutationVariables>(
    getParsedDocument(UpdateSavedViewDocument),
    {
      refetchQueries: [savedViewsRefetch],
      awaitRefetchQueries: true,
      update(cache, { data }) {
        const view = data?.updateSavedView
        if (view) {
          replaceSavedViewInMySavedViewsCache(cache, view)
        }
      },
    }
  )
  const [deleteSavedView] = useMutation<DeleteSavedViewMutation, DeleteSavedViewMutationVariables>(
    getParsedDocument(DeleteSavedViewDocument),
    {
      refetchQueries: [savedViewsRefetch],
      awaitRefetchQueries: true,
      update(cache, { data }, options) {
        if (data?.deleteSavedView && options.variables?.id) {
          removeSavedViewFromMySavedViewsCache(cache, options.variables.id)
        }
      },
    }
  )
  const [duplicateSavedView] = useMutation<DuplicateSavedViewMutation, DuplicateSavedViewMutationVariables>(
    getParsedDocument(DuplicateSavedViewDocument),
    {
      refetchQueries: [savedViewsRefetch],
      awaitRefetchQueries: true,
      update(cache, { data }) {
        const view = data?.duplicateSavedView
        if (view) {
          appendSavedViewToMySavedViewsCache(cache, view)
        }
      },
    }
  )

  const copyLink = useCallback((id: string, visibility: SavedViewVisibility) => {
    if (typeof window === 'undefined') return
    if (visibility === SavedViewVisibility.Private) return
    void navigator.clipboard.writeText(`${window.location.origin}/view/${id}`)
  }, [])

  const handleToggleVisibility = useCallback(
    async (id: string, visibility: SavedViewVisibility) => {
      await updateSavedView({
        variables: {
          id,
          data: {
            visibility:
              visibility === SavedViewVisibility.Private
                ? SavedViewVisibility.LinkShared
                : SavedViewVisibility.Private,
          },
        },
      })
    },
    [updateSavedView]
  )

  const handleRename = useCallback(async () => {
    if (!renameId || renameValue.trim().length < 1) return
    await updateSavedView({ variables: { id: renameId, data: { name: renameValue.trim() } } })
    setRenameOpen(false)
    setRenameId(null)
  }, [renameId, renameValue, updateSavedView])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    await deleteSavedView({ variables: { id: deleteId } })
    setDeleteOpen(false)
    setDeleteId(null)
  }, [deleteId, deleteSavedView])

  const handleDuplicate = useCallback(async () => {
    if (!duplicateId || duplicateName.trim().length < 2) return
    const { data: d } = await duplicateSavedView({
      variables: { id: duplicateId, name: duplicateName.trim() },
    })
    setDuplicateOpen(false)
    setDuplicateId(null)
    setDuplicateName('')
    const newId = d?.duplicateSavedView?.id
    if (newId) router.push(`/view/${newId}`)
  }, [duplicateId, duplicateName, duplicateSavedView, router])

  const columns = useMemo<ColumnDef<SavedViewRow>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 280,
      size: 320,
      enableSorting: false,
    },
    {
      id: 'entity',
      header: translation('subjectType'),
      cell: ({ row }) => (
        <SavedViewEntityTypeChip entityType={row.original.baseEntityType} />
      ),
      minSize: 128,
      size: 140,
      enableSorting: false,
    },
    {
      id: 'updated',
      header: translation('updated'),
      accessorKey: 'updatedAt',
      cell: ({ row }) => (
        <DateDisplay date={new Date(row.original.updatedAt)} mode="relative" />
      ),
      minSize: 168,
      size: 180,
      enableSorting: false,
    },
    {
      id: 'visibility',
      header: translation('viewVisibility'),
      cell: ({ row }) => (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            value={row.original.visibility === SavedViewVisibility.LinkShared}
            onValueChange={() => void handleToggleVisibility(row.original.id, row.original.visibility)}
          />
          <span className="text-sm text-description">
            {row.original.visibility === SavedViewVisibility.LinkShared
              ? translation('viewVisibilityLinkShared')
              : translation('viewVisibilityPrivate')}
          </span>
        </label>
      ),
      minSize: 200,
      size: 220,
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex flex-row items-center gap-0.5 justify-end">
          <IconButton
            tooltip={translation('openView')}
            coloringStyle="text"
            color="neutral"
            onClick={() => router.push(`/view/${row.original.id}`)}
          >
            <ExternalLink />
          </IconButton>
          <IconButton
            tooltip={
              row.original.visibility === SavedViewVisibility.Private
                ? translation('copyShareLinkEnableSharingFirst')
                : translation('copyShareLink')
            }
            coloringStyle="text"
            color="neutral"
            disabled={row.original.visibility === SavedViewVisibility.Private}
            onClick={() => copyLink(row.original.id, row.original.visibility)}
          >
            <Share2 />
          </IconButton>
          <IconButton
            tooltip={translation('rEdit', { name: translation('name') })}
            coloringStyle="text"
            color="neutral"
            onClick={() => {
              setRenameId(row.original.id)
              setRenameValue(row.original.name)
              setRenameOpen(true)
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            tooltip={translation('copyViewToMyViews')}
            coloringStyle="text"
            color="neutral"
            onClick={() => {
              setDuplicateId(row.original.id)
              setDuplicateName(`${row.original.name} (2)`)
              setDuplicateOpen(true)
            }}
          >
            <CopyPlus />
          </IconButton>
          <IconButton
            tooltip={translation('delete')}
            coloringStyle="text"
            color="negative"
            onClick={() => {
              setDeleteId(row.original.id)
              setDeleteOpen(true)
            }}
          >
            <Trash2 />
          </IconButton>
        </div>
      ),
      size: 228,
      minSize: 228,
      maxSize: 228,
      enableSorting: false,
    },
  ], [copyLink, handleToggleVisibility, router, translation])

  return (
    <Page pageTitle={titleWrapper(translation('views'))}>
      <ContentPanel
        titleElement={translation('views')}
        description={translation('viewSettingsDescription')}
      >
        {loading ? (
          <LoadingContainer className="w-full min-h-48" />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <Table
              className="w-full h-full min-w-150"
              table={{
                data: rows,
                columns,
                isUsingFillerRows: true,
                fillerRowCell,
                initialState: { pagination: { pageSize: 10 } },
              }}
            />
          </div>
        )}

        <Dialog
          isOpen={renameOpen}
          onClose={() => setRenameOpen(false)}
          titleElement={translation('rEdit', { name: translation('name') })}
          description={undefined}
        >
          <div className="flex-col-4">
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            <div className="flex-row-2 justify-end">
              <Button color="neutral" onClick={() => setRenameOpen(false)}>{translation('cancel')}</Button>
              <Button color="primary" onClick={() => void handleRename()}>{translation('confirm')}</Button>
            </div>
          </div>
        </Dialog>

        <Dialog
          isOpen={duplicateOpen}
          onClose={() => setDuplicateOpen(false)}
          titleElement={translation('copyViewToMyViews')}
          description={undefined}
        >
          <div className="flex-col-4">
            <Input value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} />
            <div className="flex-row-2 justify-end">
              <Button color="neutral" onClick={() => setDuplicateOpen(false)}>{translation('cancel')}</Button>
              <Button color="primary" onClick={() => void handleDuplicate()}>{translation('duplicate')}</Button>
            </div>
          </div>
        </Dialog>

        <ConfirmDialog
          isOpen={deleteOpen}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => void handleDelete()}
          titleElement={translation('delete')}
          description={translation('confirmDeleteView')}
          confirmType="negative"
        />
      </ContentPanel>
    </Page>
  )
}

export default ViewsSettingsPage
