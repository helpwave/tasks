import type { ReactNode } from 'react'
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

const editableTriggerButtonProps = {
  className: 'justify-between group gap-x-2 w-full min-w-32 max-w-full h-auto max-h-none px-2 py-1 font-normal text-left',
} as const

function stopRowActivation(e: React.SyntheticEvent) {
  e.stopPropagation()
}

function parseAsDate(raw: unknown): Date | null {
  if (raw == null || raw === '') return null
  const d = raw instanceof Date ? raw : new Date(raw as string)
  return Number.isNaN(d.getTime()) ? null : d
}

function wrapTrigger(node: ReactNode): ReactNode {
  return (
    <div
      className="flex min-w-32 w-full max-w-full"
      onPointerDown={stopRowActivation}
      onClick={stopRowActivation}
      onMouseDown={stopRowActivation}
    >
      {node}
    </div>
  )
}

function EditablePropertyTriggerDisplay({ property, fieldType }: { property: PropertyValueType | undefined, fieldType: FieldType }) {
  return (
    <>
      <div className="min-w-0 flex-1 overflow-hidden text-left">
        <PropertyCell property={property} fieldType={fieldType} />
      </div>
      <Edit2 className="size-4 min-w-4 shrink-0 group-hover:block hidden print:hidden" />
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
        buttonProps={editableTriggerButtonProps}
        onUpdate={(next) => {
          const t = next?.trim() ?? ''
          onValueChanged(t === '' ? null : { definitionId, textValue: t })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableTextEditPopUp>
    )
  }
  case FieldType.FieldTypeNumber: {
    const numVal = property?.numberValue ?? null
    return wrapTrigger(
      <InTableNumberEditPopUp
        value={numVal}
        buttonProps={editableTriggerButtonProps}
        onUpdate={(next) => {
          onValueChanged(next == null ? null : { definitionId, numberValue: next })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableNumberEditPopUp>
    )
  }
  case FieldType.FieldTypeCheckbox: {
    const boolVal = property?.booleanValue ?? null
    return wrapTrigger(
      <InTableCheckboxEditPopUp
        value={boolVal}
        buttonProps={editableTriggerButtonProps}
        onUpdate={(next) => {
          onValueChanged(next == null ? null : { definitionId, booleanValue: next })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableCheckboxEditPopUp>
    )
  }
  case FieldType.FieldTypeDate: {
    const d = parseAsDate(property?.dateValue)
    return wrapTrigger(
      <InTableDateTimeEditPopUp
        mode="date"
        value={d}
        buttonProps={editableTriggerButtonProps}
        onUpdate={(next) => {
          onValueChanged(
            next == null
              ? null
              : { definitionId, dateValue: next.toISOString().split('T')[0] }
          )
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableDateTimeEditPopUp>
    )
  }
  case FieldType.FieldTypeDateTime: {
    const d = parseAsDate(property?.dateTimeValue)
    return wrapTrigger(
      <InTableDateTimeEditPopUp
        mode="dateTime"
        value={d}
        buttonProps={editableTriggerButtonProps}
        onUpdate={(next) => {
          onValueChanged(
            next == null ? null : { definitionId, dateTimeValue: next.toISOString() }
          )
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableDateTimeEditPopUp>
    )
  }
  case FieldType.FieldTypeSelect: {
    const sel = property?.selectValue ?? null
    return wrapTrigger(
      <InTableSingleSelectEditPopUp
        definitionId={definitionId}
        optionLabels={definition.options}
        value={sel}
        buttonProps={editableTriggerButtonProps}
        onUpdate={(next) => {
          onValueChanged(next == null ? null : { definitionId, selectValue: next })
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableSingleSelectEditPopUp>
    )
  }
  case FieldType.FieldTypeMultiSelect: {
    const multi = property?.multiSelectValues ?? []
    return wrapTrigger(
      <InTableMultiSelectEditPopUp
        definitionId={definitionId}
        optionLabels={definition.options}
        value={multi}
        buttonProps={editableTriggerButtonProps}
        onUpdate={(next) => {
          onValueChanged(
            next == null || next.length === 0 ? null : { definitionId, multiSelectValues: next }
          )
        }}
      >
        <EditablePropertyTriggerDisplay property={property as PropertyValueType | undefined} fieldType={fieldType} />
      </InTableMultiSelectEditPopUp>
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
          size="sm"
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
