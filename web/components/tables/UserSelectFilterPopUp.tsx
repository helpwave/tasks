import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { FilterBasePopUp, FilterOperatorUtils, Visibility, type FilterListPopUpBuilderProps } from '@helpwave/hightide'
import { useId, useMemo } from 'react'
import { AssigneeSelect } from '../tasks/AssigneeSelect'


export const UserSelectFilterPopUp = ({ value, onValueChange, onRemove, name }: FilterListPopUpBuilderProps) => {
  const translation = useTasksTranslation()
  const id = useId()
  const ids = {
    select: `user-select-filter-${id}`,
  }

  const operator = useMemo(() => {
    const suggestion = value?.operator ?? 'contains'
    if (!FilterOperatorUtils.typeCheck.tagsSingle(suggestion)) {
      return 'contains'
    }
    return suggestion
  }, [value])

  const parameter = value?.parameter ?? {}

  const needsParameterInput = operator !== 'isUndefined' && operator !== 'isNotUndefined'

  return (
    <FilterBasePopUp
      name={name}
      operator={operator}
      onOperatorChange={(newOperator) => onValueChange({ dataType: 'singleTag', parameter, operator: newOperator })}
      onRemove={onRemove}
      allowedOperators={FilterOperatorUtils.operatorsByCategory.singleTag}
      hasValue={!!value}
      noParameterRequired={!needsParameterInput}
    >
      <Visibility isVisible={needsParameterInput}>
        <div className="flex-col-1">
          <label htmlFor={ids.select} className="typography-label-md">{translation('user')}</label>
          <AssigneeSelect
            value={parameter.singleOptionSearch as string ?? ''}
            onValueChanged={(newUserValue) => onValueChange({ ...value, parameter: { ...parameter, singleOptionSearch: newUserValue } })}
            onDialogClose={(newUserValue) => onValueChange({ ...value, parameter: { ...parameter, singleOptionSearch: newUserValue } })}
            onValueClear={() => onValueChange({ ...value, parameter: { ...parameter, singleOptionSearch: undefined } })}
          />
        </div>
      </Visibility>
    </FilterBasePopUp>
  )
}