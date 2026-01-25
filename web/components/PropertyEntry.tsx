import {
  CheckboxProperty,
  DateProperty,
  MultiSelectProperty,
  NumberProperty,
  SelectOption,
  SingleSelectProperty,
  TextProperty
} from '@helpwave/hightide'
import type { PropertyFieldType, PropertySelectOption, PropertyValue } from '@/components/PropertyList'

type PropertyEntrySelectProps = {
  onAddOption?: (name: string) => void,
  options: PropertySelectOption[],
}

type PropertyEntryProps = {
  value: PropertyValue,
  name: string,
  fieldType: PropertyFieldType,
  onChange: (value: PropertyValue) => void,
  onEditComplete: (value: PropertyValue) => void,
  selectData?: PropertyEntrySelectProps,
  onRemove?: () => void,
  onValueClear?: () => void,
  readOnly?: boolean,
}

// TODO move to hightide
export const PropertyEntry = ({
  value,
  name,
  fieldType,
  onChange,
  onEditComplete,
  selectData,
  onRemove,
  onValueClear,
  readOnly,
}: PropertyEntryProps) => {
  const commonProps = {
    name,
    onRemove,
    onValueClear,
    readOnly,
  }

  if (['singleSelect', 'multiSelect'].includes(fieldType) && !selectData) {
    throw new Error('PropertyEntry: When using a SingleSelect or MultiSelect field type selectData must be provided')
  }

  switch (fieldType) {
  case 'text':
    return (
      <TextProperty
        {...commonProps}
        value={value.textValue ?? ''}
        onValueChange={textValue => onChange({ ...value, textValue: textValue ?? '' })}
        onEditComplete={textValue => onEditComplete({ ...value, textValue: textValue ?? '' })}
      />
    )
  case 'number':
    return (
      <NumberProperty
        {...commonProps}
        value={value.numberValue}
        onValueChange={numberValue => onChange({ ...value, numberValue })}
        onEditComplete={numberValue => onEditComplete({ ...value, numberValue })}
      />
    )
  case 'date':
    return (
      <DateProperty
        {...commonProps}
        value={value.dateValue}
        onValueChange={dateValue => onChange({ ...value, dateValue })}
        onEditComplete={dateValue => onEditComplete({ ...value, dateValue })}
      />
    )
  case 'dateTime':
    return (
      <DateProperty
        {...commonProps}
        value={value.dateTimeValue}
        onValueChange={dateTimeValue => onChange({ ...value, dateTimeValue })}
        onEditComplete={dateTimeValue => onEditComplete({ ...value, dateTimeValue })}
      />
    )
  case 'checkbox':
    return (
      <CheckboxProperty
        {...commonProps}
        value={value.boolValue}
        onValueChange={boolValue => onChange({ ...value, boolValue })}
        onEditComplete={boolValue => onChange({ ...value, boolValue })}
      />
    )
  case 'singleSelect':
    return (
      <SingleSelectProperty
        {...commonProps}
        value={value.singleSelectValue}
        onValueChange={singleSelectValue => onChange({ ...value, singleSelectValue })}
        onEditComplete={singleSelectValue => onEditComplete({ ...value, singleSelectValue })}
      >
        {selectData?.options.map(option => (
          <SelectOption key={option.id} value={option.id}>
            {option.name}
          </SelectOption>
        ))
        }
      </SingleSelectProperty>
    )
  case 'multiSelect':
    return (
      <MultiSelectProperty
        {...commonProps}
        value={value.multiSelectValue ?? []}
        onValueChange={multiSelectValue => onChange({ ...value, multiSelectValue })}
        onEditComplete={multiSelectValue => onEditComplete({ ...value, multiSelectValue })}
      >
        {selectData?.options.map(option => (
          <SelectOption key={option.id} value={option.id}>
            {option.name}
          </SelectOption>
        ))
        }
      </MultiSelectProperty>
    )
  default:
    return <></>
  }
}
