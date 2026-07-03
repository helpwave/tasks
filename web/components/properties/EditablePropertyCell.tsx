import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Edit2 } from 'lucide-react'
import { FieldType, type PropertyDefinitionType, type PropertyValueInput, type PropertyValueType } from '@/api/gql/generated'
import { PropertyCell } from '@/components/properties/PropertyCell'
import { AssigneeSelect } from '@/components/tasks/AssigneeSelect'
import { InTableTextEditPopUp } from '@/components/tables/in-table-edit/InTableTextEditPopUp'
import { InTableNumberEditPopUp } from '@/components/tables/in-table-edit/InTableNumberEditPopUp'
import { InTableDateTimeEditPopUp } from '@/components/tables/in-table-edit/InTableDateTimeEditPopUp'
import { InTableCheckboxEditPopUp } from '@/components/tables/in-table-edit/InTableCheckboxEditPopUp'
import { InTableSingleSelectEditPopUp } from '@/components/tables/in-table-edit/InTableSingleSelectEditPopUp'
import { InTableMultiSelectEditPopUp } from '@/components/tables/in-table-edit/InTableMultiSelectEditPopUp'

export type EditablePropertyCellProps = {
  definition: PropertyDefinitionType,
  property?: PropertyValueType | undefined,
  allowUpdates: boolean,
  disabled?: boolean,
  onValueChanged: (input: PropertyValueInput | null) => void,
}

function triggerMinWidthClass(fieldType: FieldType): string {
  switch (fieldType) {
  case FieldType.FieldTypeNumber:
  case FieldType.FieldTypeCheckbox:
    return 'min-w-16'
  case FieldType.FieldTypeSelect:
    return 'min-w-24'
  default:
    return 'min-w-32'
  }
}

function editableTriggerButtonProps(minWidthClass: string) {
  return {
    className: clsx('justify-between group gap-x-2 w-full max-w-full h-auto max-h-none px-2 py-1 font-normal text-left', minWidthClass),
  }
}

function stopRowActivation(e: React.SyntheticEvent) {
  e.stopPropagation()
}

import { formatLocalCalendarDate, parseApiDateTime, parseLocalCalendarDate, serializeDateTimeForApi } from '@/utils/calendarDate'

function wrapTrigger(node: ReactNode, definitionId: string, minWidthClass: string): ReactNode {
  return (
    <div
      className={clsx('flex w-full max-w-full', minWidthClass)}
      data-testid="editable-property-cell"
      data-property-definition-id={definitionId}
      onPointerDown={stopRowActivation}
      onClick={stopRowActivation}
      onMouseDown={stopRowActivation}
    >
      {node}
    </div>
  )
}

function isChipFieldType(fieldType: FieldType): boolean {
  return (
    fieldType === FieldType.FieldTypeSelect ||
    fieldType === FieldType.FieldTypeMultiSelect ||
    fieldType === FieldType.FieldTypeCheckbox
  )
}

function EditablePropertyTriggerDisplay({ property, fieldType }: { property: PropertyValueType | undefined, fieldType: FieldType }) {
  const chipField = isChipFieldType(fieldType)
  return (
    <>
      <div className={clsx('text-left', chipField ? 'flex flex-wrap w-full max-w-full' : 'min-w-0 flex-1 overflow-hidden')}>
        <PropertyCell property={property} fieldType={fieldType} />
      </div>
      <Edit2 className="size-4 min-w-4 shrink-0 group-hover:text-on-surface text-faded print:hidden" />
    </>
  )
}

function userPropertyAssigneeValue(property: PropertyValueType | undefined): string {
  if (property?.team) {
    return `team:${property.team.id}`
  }
  return property?.user?.id ?? property?.userValue ?? ''
}

export function EditablePropertyCell({
  definition,
  property,
  allowUpdates,
  disabled,
  onValueChanged,
}: EditablePropertyCellProps) {
  const fieldType = definition.fieldType
  const definitionId = definition.id
  const minWidthClass = triggerMinWidthClass(fieldType)
  const buttonProps = editableTriggerButtonProps(minWidthClass)

  if (!allowUpdates || disabled) {
    return <PropertyCell property={property as PropertyValueType | undefined} fieldType={fieldType} />
  }

  if (fieldType === FieldType.FieldTypeUnspecified) {
    return <PropertyCell property={property as PropertyValueType | undefined} fieldType={fieldType} />
  }

  switch (fieldType) {
  case FieldType.FieldTypeText: {
    const textVal = property?.textValue ?? (property?.numberValue != null ? String(property.numberValue) : null)
    return wrapTrigger(
      <InTableTextEditPopUp
        value={textVal}
        buttonProps={buttonProps}
        onUpdate={(next) => {
          const t = next?.trim() ?? ''
          onValueChanged(t === '' ? null : { definitionId, textValue: t })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableTextEditPopUp>,
      definitionId,
      minWidthClass
    )
  }
  case FieldType.FieldTypeNumber: {
    const numVal = property?.numberValue ?? null
    return wrapTrigger(
      <InTableNumberEditPopUp
        value={numVal}
        buttonProps={buttonProps}
        onUpdate={(next) => {
          onValueChanged(next == null ? null : { definitionId, numberValue: next })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableNumberEditPopUp>,
      definitionId,
      minWidthClass
    )
  }
  case FieldType.FieldTypeCheckbox: {
    const boolVal = property?.booleanValue ?? null
    return wrapTrigger(
      <InTableCheckboxEditPopUp
        value={boolVal}
        buttonProps={buttonProps}
        onUpdate={(next) => {
          onValueChanged(next == null ? null : { definitionId, booleanValue: next })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableCheckboxEditPopUp>,
      definitionId,
      minWidthClass
    )
  }
  case FieldType.FieldTypeDate: {
    const d = parseLocalCalendarDate(property?.dateValue ?? null) ?? null
    return wrapTrigger(
      <InTableDateTimeEditPopUp
        mode="date"
        value={d}
        buttonProps={buttonProps}
        onUpdate={(next) => {
          onValueChanged(
            next == null
              ? null
              : { definitionId, dateValue: formatLocalCalendarDate(next) }
          )
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableDateTimeEditPopUp>,
      definitionId,
      minWidthClass
    )
  }
  case FieldType.FieldTypeDateTime: {
    const d = parseApiDateTime(property?.dateTimeValue ?? null) ?? null
    return wrapTrigger(
      <InTableDateTimeEditPopUp
        mode="dateTime"
        value={d}
        buttonProps={buttonProps}
        onUpdate={(next) => {
          onValueChanged(
            next == null ? null : { definitionId, dateTimeValue: serializeDateTimeForApi(next) }
          )
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableDateTimeEditPopUp>,
      definitionId,
      minWidthClass
    )
  }
  case FieldType.FieldTypeSelect: {
    const sel = property?.selectValue ?? null
    return wrapTrigger(
      <InTableSingleSelectEditPopUp
        definitionId={definitionId}
        optionLabels={definition.options}
        value={sel}
        buttonProps={{ ...buttonProps, className: clsx(buttonProps.className, { 'pl-1': !!sel }) }}
        onUpdate={(next) => {
          onValueChanged(next == null ? null : { definitionId, selectValue: next })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableSingleSelectEditPopUp>,
      definitionId,
      minWidthClass
    )
  }
  case FieldType.FieldTypeMultiSelect: {
    const multi = property?.multiSelectValues ?? []
    return wrapTrigger(
      <InTableMultiSelectEditPopUp
        definitionId={definitionId}
        optionLabels={definition.options}
        value={multi}
        buttonProps={{ ...buttonProps, className: clsx(buttonProps.className, { 'pl-1': multi.length > 0 }) }}
        onUpdate={(next) => {
          onValueChanged(
            next == null || next.length === 0 ? null : { definitionId, multiSelectValues: next }
          )
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableMultiSelectEditPopUp>,
      definitionId,
      minWidthClass
    )
  }
  case FieldType.FieldTypeUser: {
    const assigneeValue = userPropertyAssigneeValue(property as PropertyValueType | undefined)
    return (
      <div
        className="flex min-w-32 w-full max-w-full"
        onPointerDown={stopRowActivation}
        onClick={stopRowActivation}
        onMouseDown={stopRowActivation}
      >
        <AssigneeSelect
          value={assigneeValue}
          allowTeams={true}
          allowUnassigned={true}
          onValueChanged={(next) => {
            const prev = assigneeValue
            if (next === prev) {
              return
            }
            onValueChanged(next.trim() === '' ? null : { definitionId, userValue: next })
          }}
          className="flex-1 min-w-0 flex-row-2 justify-between"
        />
      </div>
    )
  }
  default:
    return <PropertyCell property={property as PropertyValueType | undefined} fieldType={fieldType} />
  }
}
