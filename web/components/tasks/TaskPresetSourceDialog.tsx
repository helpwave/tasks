import { Button, Dialog } from '@helpwave/hightide'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTaskPreset } from '@/data'
import { TaskPresetScope } from '@/api/gql/generated'

type TaskPresetSourceDialogProps = {
  isOpen: boolean,
  onClose: () => void,
  presetId: string | null,
}

export function TaskPresetSourceDialog({
  isOpen,
  onClose,
  presetId,
}: TaskPresetSourceDialogProps) {
  const translation = useTasksTranslation()
  const { data, loading } = useTaskPreset(presetId)

  const preset = data?.taskPreset

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement={translation('taskPresetSourceTitle')}
      description={undefined}
    >
      <div className="flex flex-col gap-4 min-w-[min(100vw-2rem,22rem)]">
        {loading && (
          <p className="text-description text-sm">{translation('loading')}</p>
        )}
        {!loading && !preset && (
          <p className="text-description text-sm">{translation('taskPresetSourceNotFound')}</p>
        )}
        {!loading && preset && (
          <>
            <div className="flex flex-col gap-1">
              <span className="typography-label-lg text-description">{translation('taskPresetName')}</span>
              <span className="font-medium">{preset.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="typography-label-lg text-description">{translation('taskPresetScope')}</span>
              <span>
                {preset.scope === TaskPresetScope.Global
                  ? translation('taskPresetScopeGlobal')
                  : translation('taskPresetScopePersonal')}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="typography-label-lg text-description">{translation('taskPresetSourceTasksInGraph')}</span>
              <span>{preset.graph.nodes.length}</span>
            </div>
            <Link
              href={{ pathname: '/settings/task-presets', query: { preset: preset.id } }}
              className="inline-flex"
              onClick={onClose}
            >
              <Button color="primary" coloringStyle="outline" size="sm" className="gap-2">
                <ExternalLink className="size-4" />
                {translation('taskPresetSourceOpenSettings')}
              </Button>
            </Link>
          </>
        )}
        <div className="flex justify-end pt-2">
          <Button color="neutral" size="sm" onClick={onClose}>
            {translation('close')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
