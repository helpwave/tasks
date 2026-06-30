import type { NextPage } from 'next'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Button,
  Chip,
  Dialog,
  Drawer,
  FillerCell,
  IconButton,
  LoadingContainer,
  Table
} from '@helpwave/hightide'
import type { ColumnDef } from '@tanstack/table-core'
import { EditIcon, PlusIcon, Trash2 } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { ContentPanel } from '@/components/layout/ContentPanel'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import {
  useCreateTaskPreset,
  useDeleteTaskPreset,
  useTaskPresets,
  useUpdateTaskPreset
} from '@/data'
import { TaskPresetScope } from '@/api/gql/generated'
import { TaskPresetDataEditor } from '@/components/tasks/TaskPresetDataEditor'
import { TaskPresetTaskDataEditor } from '@/components/tasks/TaskPresetTaskDataEditor'
import {
  defaultTaskPresetTask,
  graphNodesToListRows,
  listRowsToTaskGraphInput,
  type TaskPresetTask
} from '@/utils/taskGraph'

const isGlobalScope = (scope: string): boolean => scope === TaskPresetScope.Global

type PresetRowDrawerTarget = null | {
  section: 'create' | 'edit',
  index: number,
  session: number,
}

type PresetTableRow = {
  id: string,
  name: string,
  scope: string,
}

const TaskPresetsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()

  const stripPresetQueryParam = useCallback(() => {
    if (router.query['preset'] === undefined) return
    const nextQuery = { ...router.query }
    delete nextQuery['preset']
    void router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true })
  }, [router])

  const { data, loading } = useTaskPresets()

  const [createPreset] = useCreateTaskPreset()
  const [updatePreset] = useUpdateTaskPreset()
  const [deletePreset] = useDeleteTaskPreset()

  const [name, setName] = useState('')
  const [scope, setScope] = useState<TaskPresetScope>(TaskPresetScope.Personal)
  const [rows, setRows] = useState<TaskPresetTask[]>([defaultTaskPresetTask()])
  const [saving, setSaving] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRows, setEditRows] = useState<TaskPresetTask[]>([defaultTaskPresetTask()])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [presetRowDrawer, setPresetRowDrawer] = useState<PresetRowDrawerTarget>(null)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)

  const presets = useMemo(() => data?.taskPresets ?? [], [data?.taskPresets])

  const presetTableRows = useMemo<PresetTableRow[]>(
    () =>
      presets.map(p => ({
        id: p.id,
        name: p.name,
        scope: p.scope,
      })),
    [presets]
  )

  const fillerRowCell = useCallback(() => <FillerCell className="min-h-12" />, [])

  const openPresetRowDrawer = useCallback((section: 'create' | 'edit', index: number) => {
    setPresetRowDrawer(prev => ({
      section,
      index,
      session: (prev?.session ?? 0) + 1,
    }))
  }, [])

  useEffect(() => {
    if (!editOpen) {
      setPresetRowDrawer(null)
    }
  }, [editOpen])

  const resetCreateForm = useCallback(() => {
    setName('')
    setScope(TaskPresetScope.Personal)
    setRows([defaultTaskPresetTask()])
  }, [])

  const openCreateDrawer = useCallback(() => {
    resetCreateForm()
    setCreateDrawerOpen(true)
  }, [resetCreateForm])

  const handleCreate = useCallback(async () => {
    const graph = listRowsToTaskGraphInput(rows)
    if (graph.nodes.length === 0) {
      return
    }
    setSaving(true)
    try {
      await createPreset({
        variables: {
          data: {
            name: name.trim(),
            scope,
            graph,
          },
        },
      })
      resetCreateForm()
      setCreateDrawerOpen(false)
      stripPresetQueryParam()
    } finally {
      setSaving(false)
    }
  }, [createPreset, name, scope, rows, resetCreateForm, stripPresetQueryParam])

  const openEdit = useCallback(
    (id: string) => {
      const p = presets.find(x => x.id === id)
      if (!p) return
      setPresetRowDrawer(null)
      setEditId(id)
      setEditName(p.name)
      setEditRows(graphNodesToListRows(p.graph))
      setEditOpen(true)
    },
    [presets]
  )

  const closeEditDrawer = useCallback(() => {
    setEditOpen(false)
    setEditId(null)
    stripPresetQueryParam()
  }, [stripPresetQueryParam])

  const presetIdFromUrl = useMemo(() => {
    if (!router.isReady) return undefined
    const raw = router.query['preset']
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined
  }, [router.isReady, router.query])

  const consumedPresetQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (!presetIdFromUrl) {
      consumedPresetQueryRef.current = null
    }
  }, [presetIdFromUrl])

  useEffect(() => {
    if (!router.isReady || loading || !presetIdFromUrl || presets.length === 0) return
    if (consumedPresetQueryRef.current === presetIdFromUrl) return
    const found = presets.find(p => p.id === presetIdFromUrl)
    if (!found) return
    consumedPresetQueryRef.current = presetIdFromUrl
    openEdit(found.id)
  }, [router.isReady, loading, presetIdFromUrl, presets, openEdit])

  const handleUpdate = useCallback(async () => {
    if (!editId) return
    const graph = listRowsToTaskGraphInput(editRows)
    if (graph.nodes.length === 0) {
      return
    }
    setSaving(true)
    try {
      await updatePreset({
        variables: {
          id: editId,
          data: {
            name: editName.trim(),
            graph,
          },
        },
      })
      closeEditDrawer()
    } finally {
      setSaving(false)
    }
  }, [editId, editName, editRows, updatePreset, closeEditDrawer])

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      await deletePreset({ variables: { id: deleteId } })
      setDeleteOpen(false)
      setDeleteId(null)
    } finally {
      setSaving(false)
    }
  }, [deleteId, deletePreset])

  const presetColumns = useMemo<ColumnDef<PresetTableRow>[]>(
    () => [
      {
        id: 'name',
        header: translation('name'),
        accessorKey: 'name',
        cell: ({ row }) => (
          <span id={`preset-row-${row.original.id}`} className="font-medium truncate block min-w-0">
            {row.original.name}
          </span>
        ),
        minSize: 200,
        size: 280,
        enableSorting: false,
      },
      {
        id: 'scope',
        header: translation('taskPresetScope'),
        cell: ({ row }) => (
          <Chip className="coloring-tonal" color="neutral">
            <span>
              {isGlobalScope(row.original.scope)
                ? translation('taskPresetScopeGlobal')
                : translation('taskPresetScopePersonal')}
            </span>
          </Chip>
        ),
        minSize: 120,
        size: 140,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex flex-row items-center gap-0.5 justify-end">
            <IconButton
              tooltip={translation('taskPresetEdit')}
              coloringStyle="text"
              color="neutral"
              onClick={() => openEdit(row.original.id)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              tooltip={translation('taskPresetDelete')}
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
        size: 100,
        minSize: 100,
        maxSize: 100,
        enableSorting: false,
      },
    ],
    [openEdit, translation]
  )

  return (
    <Page pageTitle={titleWrapper(translation('taskPresets'))}>
      <ContentPanel
        titleElement={translation('taskPresets')}
        description={translation('taskPresetsDescription')}
        actionElement={(
          <Button
            color="primary"
            className="w-fit shrink-0"
            onClick={openCreateDrawer}
          >
            <PlusIcon className="size-4" />
            {translation('taskPresetCreate')}
          </Button>
        )}
      >
        {loading ? (
          <LoadingContainer className="w-full min-h-48" />
        ) : presetTableRows.length === 0 ? (
          <div className="text-description italic">{translation('taskPresetEmptyList')}</div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 scroll-mt-24">
            <Table
              className="w-full h-full min-w-150"
              table={{
                data: presetTableRows,
                columns: presetColumns,
                isUsingFillerRows: true,
                fillerRowCell,
                initialState: { pagination: { pageSize: 10 } },
              }}
            />
          </div>
        )}
      </ContentPanel>

      <Drawer
        isOpen={createDrawerOpen}
        onClose={() => {
          setCreateDrawerOpen(false)
          stripPresetQueryParam()
        }}
        alignment="right"
        titleElement={translation('taskPresetCreate')}
        description={undefined}
        noScrolling
      >
        <TaskPresetDataEditor
          name={name}
          onNameChange={setName}
          rows={rows}
          onRowsChange={setRows}
          onEditRow={index => openPresetRowDrawer('create', index)}
          onSave={() => void handleCreate()}
          onCancel={() => setCreateDrawerOpen(false)}
          saving={saving}
          scope={scope}
          onScopeChange={setScope}
        />
      </Drawer>

      <Drawer
        isOpen={editOpen}
        onClose={closeEditDrawer}
        alignment="right"
        titleElement={translation('taskPresetEdit')}
        description={undefined}
        noScrolling
      >
        <TaskPresetDataEditor
          name={editName}
          onNameChange={setEditName}
          rows={editRows}
          onRowsChange={setEditRows}
          onEditRow={index => openPresetRowDrawer('edit', index)}
          onSave={() => void handleUpdate()}
          onCancel={closeEditDrawer}
          saving={saving}
        />
      </Drawer>

      <Drawer
        isOpen={presetRowDrawer != null}
        onClose={() => setPresetRowDrawer(null)}
        alignment="right"
        titleElement={
          presetRowDrawer?.section === 'edit'
            ? translation('editPresetTask')
            : translation('createTask')
        }
        description={undefined}
        noScrolling
      >
        {presetRowDrawer != null && (() => {
          const row = presetRowDrawer.section === 'create'
            ? rows[presetRowDrawer.index]
            : editRows[presetRowDrawer.index]
          if (!row) {
            return null
          }
          const target = presetRowDrawer
          return (
            <TaskPresetTaskDataEditor
              key={`${target.section}-${target.index}-${target.session}`}
              formKey={`${target.section}-${target.index}-${target.session}`}
              initialTaskPresetTask={row}
              onSave={(task) => {
                if (target.section === 'create') {
                  setRows(prev => {
                    const next = [...prev]
                    const cur = next[target.index]
                    if (cur) next[target.index] = { ...cur, ...task }
                    return next
                  })
                } else {
                  setEditRows(prev => {
                    const next = [...prev]
                    const cur = next[target.index]
                    if (cur) next[target.index] = { ...cur, ...task }
                    return next
                  })
                }
                setPresetRowDrawer(null)
              }}
            />
          )
        })()}
      </Drawer>

      <Dialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setDeleteId(null)
        }}
        titleElement={translation('taskPresetDelete')}
        description={null}
        position="center"
        isModal={true}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4 py-2">
          <p className="text-description">{translation('taskPresetDeleteConfirm')}</p>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              color="neutral"
              coloringStyle="outline"
              onClick={() => {
                setDeleteOpen(false)
                setDeleteId(null)
              }}
            >
              {translation('cancel')}
            </Button>
            <Button color="negative" onClick={confirmDelete} disabled={saving}>
              {translation('taskPresetDelete')}
            </Button>
          </div>
        </div>
      </Dialog>
    </Page>
  )
}

export default TaskPresetsPage
