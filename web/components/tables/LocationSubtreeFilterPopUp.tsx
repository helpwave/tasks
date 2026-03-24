import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Button, FilterBasePopUp, type FilterListPopUpBuilderProps } from '@helpwave/hightide'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import type { LocationNodeType, LocationType } from '@/api/gql/generated'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import { useLocations } from '@/data'
import { FilterPreviewLocationChips } from '@/components/tables/FilterPreviewMedia'

function nodeToPreviewLocation(node: { id: string, title: string, kind: LocationType }) {
  return { id: node.id, title: node.title, kind: node.kind }
}

export const LocationSubtreeFilterPopUp = ({ value, onValueChange, onRemove, name }: FilterListPopUpBuilderProps) => {
  const translation = useTasksTranslation()
  const { data: locationsData } = useLocations()
  const id = useId()
  const [dialogOpen, setDialogOpen] = useState(false)
  const operator = useMemo(() => {
    const suggestion = value?.operator ?? 'equals'
    return suggestion === 'contains' ? 'contains' : 'equals'
  }, [value?.operator])

  const uuidValue = value?.parameter?.uuidValue
  const uuidValues = value?.parameter?.uuidValues
  const isMulti = operator === 'contains'

  const initialSelectedIds = useMemo(() => {
    if (isMulti) {
      const v = uuidValues
      return Array.isArray(v) ? v.map(String) : []
    }
    const u = uuidValue
    return u != null && String(u) !== '' ? [String(u)] : []
  }, [isMulti, uuidValue, uuidValues])

  const handleLocationsSelected = (locations: LocationNodeType[]) => {
    const baseParam = value?.parameter ?? {}
    const ids = locations.map(l => l.id)
    if (isMulti) {
      onValueChange({
        ...value,
        dataType: 'singleTag',
        operator: 'contains',
        parameter: { ...baseParam, uuidValue: undefined, uuidValues: ids },
      })
    } else {
      const first = ids[0]
      onValueChange({
        ...value,
        dataType: 'singleTag',
        operator: 'equals',
        parameter: { ...baseParam, uuidValue: first, uuidValues: undefined },
      })
    }
    setDialogOpen(false)
  }

  const summaryContent = useMemo((): ReactNode => {
    const locationNodes = locationsData?.locationNodes
    if (isMulti) {
      const ids = (uuidValues as string[] | undefined) ?? []
      const n = ids.length
      if (n === 0) {
        return (
          <>
            <MapPin className="size-4 shrink-0 opacity-60" />
            <span className="truncate">{translation('selectLocation')}</span>
          </>
        )
      }
      if (n > 2) {
        return (
          <>
            <MapPin className="size-4 shrink-0 opacity-60" />
            <span className="truncate text-sm">
              {n} {translation('location')}
            </span>
          </>
        )
      }
      return (
        <span className="flex flex-wrap items-center gap-1 min-w-0">
          {ids.map(locId => {
            const node = locationNodes?.find(x => x.id === locId)
            return node ? (
              <FilterPreviewLocationChips
                key={locId}
                className="max-w-[min(100%,9.5rem)]"
                locations={[nodeToPreviewLocation(node)]}
              />
            ) : (
              <span key={locId} className="text-sm truncate">
                {locId}
              </span>
            )
          })}
        </span>
      )
    }
    const uid = uuidValue != null && String(uuidValue) !== ''
      ? String(uuidValue)
      : undefined
    if (!uid) {
      return (
        <>
          <MapPin className="size-4 shrink-0 opacity-60" />
          <span className="truncate">{translation('selectLocation')}</span>
        </>
      )
    }
    const node = locationNodes?.find(n => n.id === uid)
    const label = node?.title ?? translation('selectLocation')
    return node ? (
      <FilterPreviewLocationChips
        className="max-w-[min(100%,14rem)]"
        locations={[nodeToPreviewLocation(node)]}
      />
    ) : (
      <>
        <MapPin className="size-4 shrink-0 opacity-60" />
        <span className="truncate text-sm">{label}</span>
      </>
    )
  }, [isMulti, locationsData?.locationNodes, uuidValue, uuidValues, translation])

  return (
    <>
      <FilterBasePopUp
        name={name}
        operator={operator}
        outsideClickOptions={{ active: !dialogOpen }}
        onOperatorChange={(newOperator) => {
          const baseParam = value?.parameter ?? {}
          const next = newOperator === 'contains' ? 'contains' : 'equals'
          if (next === 'equals') {
            const u = baseParam.uuidValues
            const first = Array.isArray(u) && u.length > 0 ? String(u[0]) : undefined
            onValueChange({
              dataType: 'singleTag',
              parameter: { ...baseParam, uuidValue: first, uuidValues: undefined },
              operator: 'equals',
            })
          } else {
            const u = baseParam.uuidValue
            onValueChange({
              dataType: 'singleTag',
              parameter: {
                ...baseParam,
                uuidValue: undefined,
                uuidValues: u != null && String(u) !== '' ? [String(u)] : [],
              },
              operator: 'contains',
            })
          }
        }}
        onRemove={onRemove}
        allowedOperators={['equals', 'contains']}
        noParameterRequired={false}
      >
        <div className="flex-col-1 gap-2">
          <label htmlFor={id} className="typography-label-md">{translation('location')}</label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              id={id}
              type="button"
              color="neutral"
              coloringStyle="outline"
              className="inline-flex items-center gap-2 min-w-0 max-w-full h-auto py-1.5"
              onClick={() => setDialogOpen(true)}
            >
              {summaryContent}
            </Button>
          </div>
        </div>
      </FilterBasePopUp>
      <LocationSelectionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={handleLocationsSelected}
        initialSelectedIds={initialSelectedIds}
        multiSelect={isMulti}
        useCase="default"
      />
    </>
  )
}
