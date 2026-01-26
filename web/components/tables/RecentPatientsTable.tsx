import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, Row } from '@tanstack/react-table'
import type { GetOverviewDataQuery } from '@/api/gql/generated'
import { useCallback, useMemo } from 'react'
import type { TableProps } from '@helpwave/hightide'
import { Chip, FillerCell, Table, TableColumnSwitcher, Tooltip } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'
import { useGetPropertyDefinitionsQuery, PropertyEntity, ColumnType, FieldType } from '@/api/gql/generated'

type PatientViewModel = GetOverviewDataQuery['recentPatients'][0]

export interface RecentPatientsTableProps extends Omit<TableProps<PatientViewModel>, 'table'> {
  patients: PatientViewModel[],
  onSelectPatient: (id: string) => void,
}

export const RecentPatientsTable = ({
  patients,
  onSelectPatient,
  ...props
}: RecentPatientsTableProps) => {
  const translation = useTasksTranslation()
  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery()

  const patientPropertyColumns = useMemo<ColumnDef<PatientViewModel>[]>(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return []

    const patientProperties = propertyDefinitionsData.propertyDefinitions.filter(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Patient)
    )

    return patientProperties.map(prop => {
      const columnId = `property_${prop.id}`

      const getFilterFn = () => {
        switch (prop.fieldType) {
        case FieldType.FieldTypeCheckbox:
          return 'boolean'
        case FieldType.FieldTypeDate:
        case FieldType.FieldTypeDateTime:
          return 'date'
        case FieldType.FieldTypeNumber:
          return 'number'
        case FieldType.FieldTypeSelect:
        case FieldType.FieldTypeMultiSelect:
          return 'tags'
        default:
          return 'text'
        }
      }

      const extractOptionIndex = (value: string): number | null => {
        const match = value.match(/-opt-(\d+)$/)
        return match && match[1] ? parseInt(match[1], 10) : null
      }

      return {
        id: columnId,
        header: prop.name,
        accessorFn: (row) => {
          const property = row.properties?.find(
            p => p.definition.id === prop.id
          )
          if (!property) return null
          if (prop.fieldType === FieldType.FieldTypeMultiSelect) {
            return property.multiSelectValues ?? null
          }
          return (
            property.textValue ??
            property.numberValue ??
            property.booleanValue ??
            property.dateValue ??
            property.dateTimeValue ??
            property.selectValue ??
            null
          )
        },
        cell: ({ row }) => {
          const property = row.original.properties?.find(
            p => p.definition.id === prop.id
          )
          if (!property) return <FillerCell className="min-h-8" />

          if (typeof property.booleanValue === 'boolean') {
            return (
              <Chip
                className="coloring-tonal"
                color={property.booleanValue ? 'positive' : 'negative'}
              >
                {property.booleanValue
                  ? translation('yes')
                  : translation('no')}
              </Chip>
            )
          }

          if (
            prop.fieldType === FieldType.FieldTypeDate &&
            property.dateValue
          ) {
            return (
              <SmartDate
                date={new Date(property.dateValue)}
                showTime={false}
              />
            )
          }

          if (
            prop.fieldType === FieldType.FieldTypeDateTime &&
            property.dateTimeValue
          ) {
            return (
              <SmartDate date={new Date(property.dateTimeValue)} />
            )
          }

          if (
            prop.fieldType === FieldType.FieldTypeSelect &&
            property.selectValue
          ) {
            const selectValue = property.selectValue
            const optionIndex = extractOptionIndex(selectValue)
            if (
              optionIndex !== null &&
              optionIndex >= 0 &&
              optionIndex < prop.options.length
            ) {
              return (
                <Chip className="coloring-tonal">
                  {prop.options[optionIndex]}
                </Chip>
              )
            }
            return <span>{selectValue}</span>
          }

          if (
            prop.fieldType === FieldType.FieldTypeMultiSelect &&
            property.multiSelectValues &&
            property.multiSelectValues.length > 0
          ) {
            return (
              <div className="flex flex-wrap gap-1">
                {property.multiSelectValues
                  .filter((val): val is string => val !== null && val !== undefined)
                  .map((val, idx) => {
                    const optionIndex = extractOptionIndex(val)
                    const optionText =
                      optionIndex !== null &&
                      optionIndex >= 0 &&
                      optionIndex < prop.options.length
                        ? prop.options[optionIndex]
                        : val
                    return (
                      <Chip key={idx} className="coloring-tonal">
                        {optionText}
                      </Chip>
                    )
                  })}
              </div>
            )
          }

          if (
            property.textValue !== null &&
            property.textValue !== undefined
          ) {
            return <span>{property.textValue.toString()}</span>
          }

          if (
            property.numberValue !== null &&
            property.numberValue !== undefined
          ) {
            return <span>{property.numberValue.toString()}</span>
          }

          return <FillerCell className="min-h-8" />
        },
        meta: {
          columnType: ColumnType.Property,
          propertyDefinitionId: prop.id,
          fieldType: prop.fieldType,
          ...(getFilterFn() === 'tags' && {
            filterData: {
              tags: prop.options.map((opt, idx) => ({
                label: opt,
                tag: `${prop.id}-opt-${idx}`,
              })),
            },
          }),
        },
        minSize: 150,
        size: 200,
        maxSize: 300,
        filterFn: getFilterFn(),
      } as ColumnDef<PatientViewModel>
    })
  }, [propertyDefinitionsData, translation])

  const patientColumns = useMemo<ColumnDef<PatientViewModel>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      cell: ({ row }) => {
        return (
          <Tooltip tooltip={row.original.name} containerClassName="overflow-hidden w-fit max-w-full !block">
            <span className="truncate block">{row.original.name}</span>
          </Tooltip>
        )
      },
      minSize: 160,
      filterFn: 'text',
    },
    {
      id: 'location',
      header: translation('location'),
      accessorKey: 'position',
      cell: ({ row }) => (
        <LocationChips
          locations={row.original.position ? [row.original.position] : []}
          small
          className="min-h-8"
          placeholderProps={{ className: 'min-h-8 block' }}
        />
      ),
      minSize: 200,
      filterFn: 'text',
    },
    {
      id: 'updated',
      header: translation('updated'),
      accessorFn: (value) => {
        const tasks = value.tasks || []
        const updateDates = tasks
          .map(t => t.updateDate ? new Date(t.updateDate) : null)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime())
        return updateDates[0]
      },
      cell: ({ getValue }) => {
        const date = getValue() as Date | undefined
        if (!date) return <FillerCell/>
        return (
          <SmartDate date={date}/>
        )
      },
      minSize: 200,
      size: 200,
      maxSize: 200,
      filterFn: 'date',
    },
    ...patientPropertyColumns,
  ], [translation, patientPropertyColumns])

  return (
    <Table
      {...props}
      table={{
        data: patients,
        columns: patientColumns,
        fillerRowCell: useCallback(() => (<FillerCell className="min-h-8"/>), []),
        onRowClick: useCallback((row: Row<PatientViewModel>) => onSelectPatient(row.original.id), [onSelectPatient]),
        initialState: {
          pagination: {
            pageSize: 25,
          }
        }
      }}
      header={(
        <div className="flex-row-4 justify-between items-center">
          <div className="flex-col-0">
            <span className="typography-title-lg">{translation('recentPatients')}</span>
            <span className="text-description">{translation('patientsUpdatedRecently')}</span>
          </div>
          <div>
            <TableColumnSwitcher/>
          </div>
        </div>
      )}
    />
  )
}