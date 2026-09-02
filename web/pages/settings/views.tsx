'use client'

import type { NextPage } from 'next'
import { useCallback, useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useRouter } from 'next/router'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button, ConfirmDialog, Dialog, FillerCell, IconButton, Input, TableDisplay, TableProvider, overscanRowsForBuffer } from '@helpwave/hightide'
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
import { ScopeChip } from '@/components/locations/ScopeChip'
import {
  isScopeComplete,
  privateScope,
  ScopeVisibilityField,
  scopeEquals,
  scopeFromEntity,
  scopeToInput,
  type ScopeValue
} from '@/components/locations/ScopeVisibilityField'

import { ListLoadingHint } from '@/components/common/ListLoadingHint'

const TABLE_ROW_ESTIMATE_PX = 48
const TABLE_OVERSCAN_ROWS = overscanRowsForBuffer(800, TABLE_ROW_ESTIMATE_PX)

type SavedViewRowGql = MySavedViewsQuery['mySavedViews'][number]

type SavedViewRow = {
  id: string,
  name: string,
  baseEntityType: SavedViewEntityType,
  updatedAt: string,
  isOwner: boolean,
  scope: ScopeValue,
}

const ViewsSettingsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { data, loading } = useMySavedViews({ fetchPolicy: 'cache-and-network' })
  const rows: SavedViewRow[] = useMemo(() => {
    return ((data?.mySavedViews ?? []) as SavedViewRowGql[]).map((v: SavedViewRowGql) => ({
      id: v.id,
      name: v.name,
      baseEntityType: v.baseEntityType,
      updatedAt: v.updatedAt,
      isOwner: v.isOwner,
      scope: scopeFromEntity(v),
    }))
  }, [data])

  const fillerRowCell = useCallback(() => (<FillerCell className="min-h-12" />), [])

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editScope, setEditScope] = useState<ScopeValue>(privateScope)
  const [editInitialScope, setEditInitialScope] = useState<ScopeValue>(privateScope)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)
  const [duplicateName, setDuplicateName] = useState('')

  const savedViewsRefetch = 'MySavedViews'
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

  const copyLink = useCallback((id: string) => {
    if (typeof window === 'undefined') return
    void navigator.clipboard.writeText(`${window.location.origin}/view/${id}`)
  }, [])

  const handleEdit = useCallback(async () => {
    if (!editId || editName.trim().length < 1 || !isScopeComplete(editScope)) return
    await updateSavedView({
      variables: {
        id: editId,
        data: {
          name: editName.trim(),
          ...(scopeEquals(editScope, editInitialScope) ? {} : scopeToInput(editScope)),
        },
      },
    })
    setEditOpen(false)
    setEditId(null)
  }, [editId, editName, editScope, editInitialScope, updateSavedView])

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
      id: 'scope',
      header: translation('scopeVisibility'),
      cell: ({ row }) => (
        <ScopeChip visibility={row.original.scope.visibility} location={row.original.scope.location} small />
      ),
      minSize: 180,
      size: 220,
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
            tooltip={translation('copyShareLink')}
            coloringStyle="text"
            color="neutral"
            onClick={() => copyLink(row.original.id)}
          >
            <Share2 />
          </IconButton>
          {row.original.isOwner && (
            <IconButton
              tooltip={translation('edit')}
              coloringStyle="text"
              color="neutral"
              onClick={() => {
                setEditId(row.original.id)
                setEditName(row.original.name)
                setEditScope(row.original.scope)
                setEditInitialScope(row.original.scope)
                setEditOpen(true)
              }}
            >
              <EditIcon />
            </IconButton>
          )}
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
          {row.original.isOwner && (
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
          )}
        </div>
      ),
      size: 228,
      minSize: 228,
      maxSize: 228,
      enableSorting: false,
    },
  ], [copyLink, router, translation])

  const pageSize = Math.max(rows.length, 1)

  return (
    <Page pageTitle={titleWrapper(translation('views'))} noScrolling noSpacer>
      <ContentPanel
        className="flex-1 min-h-0 pb-4"
        titleElement={translation('views')}
        description={translation('viewSettingsDescription')}
      >
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
          <div
            aria-busy={loading}
            className="flex-1 min-h-0 flex flex-col"
          >
            <TableProvider
              data={rows}
              columns={columns}
              isUsingFillerRows
              fillerRowCell={fillerRowCell}
              initialState={{ pagination: { pageSize } }}
            >
              <div className="flex-1 min-h-0 flex flex-col">
                <TableDisplay
                  virtualized={{ scroll: 'container', estimateRowHeight: TABLE_ROW_ESTIMATE_PX, overscan: TABLE_OVERSCAN_ROWS }}
                  tableHeaderProps={{ isSticky: true }}
                  containerProps={{
                    className: 'flex-1 min-h-0 overflow-y-auto',
                  }}
                  className="w-full min-w-150 overflow-x-auto hw-touch-scroll"
                />
              </div>
            </TableProvider>
          </div>
          <ListLoadingHint active={loading} />
        </div>

        <Dialog
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          titleElement={translation('rEdit', { name: translation('savedViews') })}
          description={undefined}
        >
          <div className="flex-col-4">
            <div className="flex flex-col gap-1">
              <label>{translation('name')}</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <ScopeVisibilityField value={editScope} onChange={setEditScope} />
            <div className="flex-row-2 justify-end">
              <Button color="neutral" onClick={() => setEditOpen(false)}>{translation('cancel')}</Button>
              <Button
                color="primary"
                disabled={editName.trim().length < 1 || !isScopeComplete(editScope)}
                onClick={() => void handleEdit()}
              >
                {translation('confirm')}
              </Button>
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
