import type { FilterValue } from '@helpwave/hightide'
import { Chip } from '@helpwave/hightide'
import { MapPin } from 'lucide-react'
import { useMemo } from 'react'
import { useLocations } from '@/data'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export function LocationFilterActiveLabel({ value }: { value: FilterValue }) {
  const translation = useTasksTranslation()
  const { data } = useLocations()
  const nodes = data?.locationNodes

  const content = useMemo(() => {
    const param = value?.parameter ?? {}
    const op = value?.operator ?? 'equals'
    if (op === 'contains') {
      const ids = (param.uuidValues as string[] | undefined) ?? []
      if (ids.length === 0) {
        return <span className="text-sm">{translation('selectLocation')}</span>
      }
      if (ids.length <= 2) {
        return (
          <span className="flex flex-wrap items-center gap-1">
            {ids.map(id => {
              const node = nodes?.find(n => n.id === id)
              const title = node?.title ?? id
              return (
                <Chip key={id} size="sm" color="neutral" className="max-w-[10rem]">
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{title}</span>
                  </span>
                </Chip>
              )
            })}
          </span>
        )
      }
      return (
        <Chip size="sm" color="neutral">
          <span className="flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            {ids.length} {translation('location')}
          </span>
        </Chip>
      )
    }
    const uid = param.uuidValue != null ? String(param.uuidValue) : ''
    if (!uid) {
      return <span className="text-sm">{translation('selectLocation')}</span>
    }
    const node = nodes?.find(n => n.id === uid)
    const title = node?.title ?? uid
    return (
      <Chip size="sm" color="neutral" className="max-w-[14rem]">
        <span className="flex items-center gap-1 min-w-0">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{title}</span>
        </span>
      </Chip>
    )
  }, [nodes, translation, value])

  return content
}
