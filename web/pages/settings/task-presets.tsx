import type { NextPage } from 'next'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Button,
  Chip,
  Dialog,
  Drawer,
  FillerCell,
  FocusTrapWrapper,
  IconButton,
  Input,
  LoadingContainer,
  Select,
  SelectOption,
  Table
} from '@helpwave/hightide'
import type { ColumnDef } from '@tanstack/table-core'
import { ArrowLeft, EditIcon, Pencil, PlusIcon, Save, Trash2, X } from 'lucide-react'
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
import { TaskDataEditor } from '@/components/tasks/TaskDataEditor'
import type { TaskPresetListRow } from '@/utils/taskGraph'
import { graphNodesToListRows, listRowsToTaskGraphInput } from '@/utils/taskGraph'
import clsx from 'clsx'
import { PriorityUtils } from '@/utils/priority'

const isGlobalScope = (scope: string): boolean => scope === TaskPresetScope.Global

const defaultRow = (): TaskPresetListRow => ({
  title: '',
  description: '',
  priority: null,
  estimatedTime: null,
})

const hasEmptyTaskTitle = (rows: TaskPresetListRow[]): boolean =>
  rows.some(r => r.title.trim() === '')

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

  const { data, loading, refetch } = useTaskPresets()

  const [createPreset] = useCreateTaskPreset()
  const [updatePreset] = useUpdateTaskPreset()
  const [deletePreset] = useDeleteTaskPreset()

  const [name, setName] = useState('')
  const [scope, setScope] = useState<TaskPresetScope>(TaskPresetScope.Personal)
  const [rows, setRows] = useState<TaskPresetListRow[]>([defaultRow()])
  const [saving, setSaving] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRows, setEditRows] = useState<TaskPresetListRow[]>([defaultRow()])
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
    setRows([defaultRow()])
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
      await refetch()
      resetCreateForm()
      setCreateDrawerOpen(false)
      stripPresetQueryParam()
    } finally {
      setSaving(false)
    }
  }, [createPreset, name, scope, rows, refetch, resetCreateForm, stripPresetQueryParam])

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

  const closeEditDialog = useCallback(() => {
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
      await refetch()
      closeEditDialog()
    } finally {
      setSaving(false)
    }
  }, [editId, editName, editRows, updatePreset, refetch, closeEditDialog])

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      await deletePreset({ variables: { id: deleteId } })
      await refetch()
      setDeleteOpen(false)
      setDeleteId(null)
    } finally {
      setSaving(false)
    }
  }, [deleteId, deletePreset, refetch])

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
      >
        <div className="flex flex-col gap-12">
          <Button
            color="neutral"
            coloringStyle="outline"
            className="w-fit"
            onClick={() => router.push('/settings')}
          >
            <ArrowLeft className="size-4" />
            {translation('settings')}
          </Button>

          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-divider pb-3">
              <h2 className="typography-title-md font-semibold">
                {translation('taskPresets')}
              </h2>
              <Button
                color="primary"
                className="w-fit shrink-0"
                onClick={openCreateDrawer}
              >
                <PlusIcon className="size-4" />
                {translation('taskPresetCreate')}
              </Button>
            </div>
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
          </section>
        </div>
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
      >
        <div className="flex flex-col gap-8 pb-6 overflow-y-auto max-h-[min(85dvh,calc(100dvh-5rem))] px-1">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-3">
              <span className="typography-label-lg">{translation('taskPresetName')}</span>
              <Input value={name} onChange={e => setName(e.target.value)} className="w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <span className="typography-label-lg">{translation('taskPresetScope')}</span>
              <Select
                value={scope}
                onValueChange={v => setScope(v as TaskPresetScope)}
                buttonProps={{ className: 'w-full' }}
              >
                <SelectOption
                  value={TaskPresetScope.Personal}
                  label={translation('taskPresetScopePersonal')}
                >
                  {translation('taskPresetScopePersonal')}
                </SelectOption>
                <SelectOption
                  value={TaskPresetScope.Global}
                  label={translation('taskPresetScopeGlobal')}
                >
                  {translation('taskPresetScopeGlobal')}
                </SelectOption>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-5 mt-2 pt-2 border-t border-divider">
            <span className="typography-label-lg">{translation('addTask')}</span>
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 p-5 md:p-6 rounded-xl border border-border bg-background"
              >
                <div className="flex flex-col xl:flex-row xl:items-start gap-5 xl:gap-10 justify-between">
                  <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
                    <Input
                      placeholder={translation('taskTitlePlaceholder')}
                      value={row.title}
                      onChange={e => {
                        const next = [...rows]
                        const cur = next[index] ?? defaultRow()
                        next[index] = { ...cur, title: e.target.value }
                        setRows(next)
                      }}
                      className="w-full"
                    />
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      <span className="inline-flex items-center gap-2 text-description">
                        <span
                          className={clsx(
                            'size-2.5 rounded-full shrink-0',
                            PriorityUtils.toBackgroundColor(row.priority)
                          )}
                        />
                        {row.priority
                          ? translation('priority', { priority: row.priority })
                          : translation('priorityNone')}
                      </span>
                      <span className="text-description">
                        {row.estimatedTime != null && row.estimatedTime > 0
                          ? `${translation('estimatedTime')}: ${row.estimatedTime}`
                          : translation('taskPresetNoEstimate')}
                      </span>
                    </div>
                    {row.description.trim() !== '' && (
                      <p className="text-sm text-description leading-relaxed line-clamp-3 whitespace-pre-wrap">
                        {row.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-0.5 shrink-0">
                    <IconButton
                      type="button"
                      tooltip={translation('taskPresetEditDetails')}
                      coloringStyle="text"
                      color="neutral"
                      className="shrink-0"
                      onClick={() => openPresetRowDrawer('create', index)}
                    >
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton
                      type="button"
                      tooltip={translation('taskPresetRemoveRow')}
                      coloringStyle="text"
                      color="negative"
                      className="shrink-0"
                      onClick={() => setRows(rows.filter((_, i) => i !== index))}
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              color="neutral"
              coloringStyle="outline"
              className="w-fit"
              onClick={() => setRows([...rows, defaultRow()])}
            >
              <PlusIcon className="size-4" />
              {translation('taskPresetAddRow')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-divider sticky bottom-0 bg-surface-1 -mx-1 px-1 pb-1">
            <Button
              color="neutral"
              coloringStyle="outline"
              className="gap-2"
              onClick={() => setCreateDrawerOpen(false)}
            >
              <X className="size-4 shrink-0" />
              {translation('cancel')}
            </Button>
            <Button
              color="primary"
              className="gap-2"
              onClick={() => void handleCreate()}
              disabled={
                saving
                || !name.trim()
                || listRowsToTaskGraphInput(rows).nodes.length === 0
                || hasEmptyTaskTitle(rows)
              }
            >
              <Save className="size-4 shrink-0" />
              {translation('taskPresetSave')}
            </Button>
          </div>
        </div>
      </Drawer>

      <Drawer
        isOpen={presetRowDrawer != null}
        onClose={() => setPresetRowDrawer(null)}
        alignment="right"
        titleElement={translation('createTask')}
        description={undefined}
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
            <TaskDataEditor
              key={`${target.section}-${target.index}-${target.session}`}
              id={null}
              presetRowEditor={{
                formKey: `${target.section}-${target.index}-${target.session}`,
                title: row.title,
                description: row.description,
                priority: row.priority,
                estimatedTime: row.estimatedTime,
                onSave: (data) => {
                  const apply = (r: TaskPresetListRow): TaskPresetListRow => ({
                    ...r,
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    estimatedTime: data.estimatedTime,
                  })
                  if (target.section === 'create') {
                    setRows(prev => {
                      const next = [...prev]
                      const cur = next[target.index]
                      if (cur) next[target.index] = apply(cur)
                      return next
                    })
                  } else {
                    setEditRows(prev => {
                      const next = [...prev]
                      const cur = next[target.index]
                      if (cur) next[target.index] = apply(cur)
                      return next
                    })
                  }
                  setPresetRowDrawer(null)
                },
              }}
              onClose={() => setPresetRowDrawer(null)}
            />
          )
        })()}
      </Drawer>

      <Dialog
        isOpen={editOpen}
        onClose={closeEditDialog}
        titleElement={translation('taskPresetEdit')}
        description={null}
        position="center"
        isModal={true}
        className="max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        <FocusTrapWrapper active={editOpen}>
          <div className="flex flex-col gap-8 py-3 overflow-y-auto max-h-[72vh] px-1">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="typography-label-lg">{translation('taskPresetName')}</span>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="w-full" />
            </div>
            <div className="flex flex-col gap-5 mt-2 pt-2 border-t border-divider">
              <span className="typography-label-lg">{translation('addTask')}</span>
              {editRows.map((row, index) => (
                <div
                  key={index}
                  className={clsx(
                    'flex flex-col gap-4 p-5 md:p-6 rounded-xl border bg-background',
                    row.title.trim() === '' ? 'border-negative bg-negative/10' : 'border-border'
                  )}
                >
                  <div className="flex flex-col xl:flex-row xl:items-start gap-5 xl:gap-10 justify-between">
                    <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
                      <Input
                        placeholder={translation('taskTitlePlaceholder')}
                        value={row.title}
                        onChange={e => {
                          const next = [...editRows]
                          const cur = next[index] ?? defaultRow()
                          next[index] = { ...cur, title: e.target.value }
                          setEditRows(next)
                        }}
                        className="w-full"
                      />
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        <span className="inline-flex items-center gap-2 text-description">
                          <span
                            className={clsx(
                              'size-2.5 rounded-full shrink-0',
                              PriorityUtils.toBackgroundColor(row.priority)
                            )}
                          />
                          {row.priority
                            ? translation('priority', { priority: row.priority })
                            : translation('priorityNone')}
                        </span>
                        <span className="text-description">
                          {row.estimatedTime != null && row.estimatedTime > 0
                            ? `${translation('estimatedTime')}: ${row.estimatedTime}`
                            : translation('taskPresetNoEstimate')}
                        </span>
                      </div>
                      {row.description.trim() !== '' && (
                        <p className="text-sm text-description leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {row.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-0.5 shrink-0">
                      <IconButton
                        type="button"
                        tooltip={translation('taskPresetEditDetails')}
                        coloringStyle="text"
                        color="neutral"
                        className="shrink-0"
                        onClick={() => openPresetRowDrawer('edit', index)}
                      >
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton
                        type="button"
                        tooltip={translation('taskPresetRemoveRow')}
                        coloringStyle="text"
                        color="negative"
                        className="shrink-0"
                        onClick={() => setEditRows(editRows.filter((_, i) => i !== index))}
                        disabled={editRows.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                color="neutral"
                coloringStyle="outline"
                className="w-fit"
                onClick={() => setEditRows([...editRows, defaultRow()])}
              >
                <PlusIcon className="size-4" />
                {translation('taskPresetAddRow')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-divider">
              <Button
                color="neutral"
                coloringStyle="outline"
                className="gap-2"
                onClick={closeEditDialog}
              >
                <X className="size-4 shrink-0" />
                {translation('cancel')}
              </Button>
              <Button
                color="primary"
                className="gap-2"
                onClick={handleUpdate}
                disabled={
                  saving
                  || !editName.trim()
                  || !editId
                  || listRowsToTaskGraphInput(editRows).nodes.length === 0
                  || hasEmptyTaskTitle(editRows)
                }
              >
                <Save className="size-4 shrink-0" />
                {translation('taskPresetSave')}
              </Button>
            </div>
          </div>
        </FocusTrapWrapper>
      </Dialog>

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
