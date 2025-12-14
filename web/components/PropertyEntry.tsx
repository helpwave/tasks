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
  readOnly?: boolean,
}

// TODO move to hightide
/**
 * A component for displaying a PropertyEntry
 */
export const PropertyEntry = ({
                                value,
                                name,
                                fieldType,
                                onChange,
                                onEditComplete,
                                selectData,
                                onRemove,
                                readOnly,
                              }: PropertyEntryProps) => {
  const commonProps = {
    name,
    onRemove,
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
          value={value.textValue}
          onChange={textValue => onChange({ ...value, textValue })}
          onEditComplete={textValue => onEditComplete({ ...value, textValue })}
        />
      )
    case 'number':
      return (
        <NumberProperty
          {...commonProps}
          value={value.numberValue}
          onChange={numberValue => onChange({ ...value, numberValue })}
          onEditComplete={numberValue => onEditComplete({ ...value, numberValue })}
        />
      )
    case 'date':
      return (
        <DateProperty
          {...commonProps}
          value={value.dateValue}
          onChange={dateValue => onChange({ ...value, dateValue })}
          onEditComplete={dateValue => onEditComplete({ ...value, dateValue })}
        />
      )
    case 'dateTime':
      return (
        <DateProperty
          {...commonProps}
          value={value.dateTimeValue}
          onChange={dateTimeValue => onChange({ ...value, dateTimeValue })}
          onEditComplete={dateTimeValue => onEditComplete({ ...value, dateTimeValue })}
        />
      )
    case 'checkbox':
      return (
        <CheckboxProperty
          {...commonProps}
          value={value.boolValue}
          onChange={boolValue => onChange({ ...value, boolValue })}
        />
      )
    case 'singleSelect':
      return (
        <SingleSelectProperty
          {...commonProps}
          value={value.singleSelectValue}
          onValueChanged={singleSelectValue => {
            const newProperty = { ...value, singleSelectValue }
            onChange(newProperty)
            onEditComplete(newProperty)
          }}
          onAddNew={selectData?.onAddOption}
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
          values={value.multiSelectValue ?? []}
          onValuesChanged={multiSelectValue => {
            const newProperty = { ...value, multiSelectValue }
            onChange(newProperty)
            onEditComplete(newProperty)
          }}
          // TODO handle onAddNew once it exists
          // onAddNew={selectData?.onAddOption}
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
      console.error(`Unimplemented property type used for PropertyEntry: ${fieldType}`)
      return <></>
  }
}
