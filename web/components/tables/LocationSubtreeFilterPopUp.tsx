import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Button, FilterBasePopUp, type FilterListPopUpBuilderProps } from '@helpwave/hightide'
import { useId, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import type { LocationNodeType } from '@/api/gql/generated'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import { useLocations } from '@/data'

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

  const summary = useMemo(() => {
    const nodes = locationsData?.locationNodes
    if (isMulti) {
      const n = (uuidValues as string[] | undefined)?.length ?? 0
      return n === 0 ? translation('selectLocation') : `${n} ${translation('location')}`
    }
    const uid = uuidValue != null && String(uuidValue) !== ''
      ? String(uuidValue)
      : undefined
    if (!uid) {
      return translation('selectLocation')
    }
    const node = nodes?.find(n => n.id === uid)
    return node?.title ?? translation('selectLocation')
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
              className="inline-flex items-center gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <MapPin className="size-4" />
              {summary}
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
