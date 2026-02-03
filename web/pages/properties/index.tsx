import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button, Chip, FillerCell, LoadingContainer, Table } from '@helpwave/hightide'
import { useCallback, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { EditIcon, PlusIcon } from 'lucide-react'
import { Drawer } from '@helpwave/hightide'
import type { Property } from '@/components/tables/PropertyList'
import { PropertyDetailView } from '@/components/properties/PropertyDetailView'
import { FieldType, PropertyEntity } from '@/api/gql/generated'
import { usePropertyDefinitions } from '@/data'

const PropertiesPage: NextPage = () => {
  const translation = useTasksTranslation()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selected, setSelected] = useState<Property>()

  const mapFieldTypeFromBackend = (fieldType: FieldType): Property['fieldType'] => {
    const mapping: Record<FieldType, Property['fieldType']> = {
      [FieldType.FieldTypeText]: 'text',
      [FieldType.FieldTypeNumber]: 'number',
      [FieldType.FieldTypeCheckbox]: 'checkbox',
      [FieldType.FieldTypeDate]: 'date',
      [FieldType.FieldTypeDateTime]: 'dateTime',
      [FieldType.FieldTypeSelect]: 'singleSelect',
      [FieldType.FieldTypeMultiSelect]: 'multiSelect',
      [FieldType.FieldTypeUser]: 'user',
      [FieldType.FieldTypeUnspecified]: 'text',
    }
    return mapping[fieldType] || 'text'
  }

  const mapSubjectTypeFromBackend = (entity: PropertyEntity): Property['subjectType'] => {
    return entity === PropertyEntity.Patient ? 'patient' : 'task'
  }

  const { data: propertyDefinitionsData, refetch } = usePropertyDefinitions()

  const data = propertyDefinitionsData?.propertyDefinitions?.map(def => ({
    id: def.id,
    name: def.name,
    description: def.description || undefined,
    subjectType: mapSubjectTypeFromBackend(def.allowedEntities[0] || PropertyEntity.Patient),
    fieldType: mapFieldTypeFromBackend(def.fieldType),
    isArchived: !def.isActive,
    selectData: (def.fieldType === FieldType.FieldTypeSelect || def.fieldType === FieldType.FieldTypeMultiSelect) && def.options.length > 0 ? {
      isAllowingFreetext: false,
      options: def.options.map((opt, idx) => ({
        id: `${def.id}-opt-${idx}`,
        name: opt,
        description: undefined,
        isCustom: false,
      })),
    } : undefined,
  } as Property)) || []

  const handleEdit = (value: Property) => {
    setSelected({
      ...value,
      selectData: value.selectData ? {
        ...value.selectData,
        options: value.selectData.options || [],
      } : undefined,
    })
    setIsPanelOpen(true)
  }

  const handleAdd = () => {
    setSelected(undefined)
    setIsPanelOpen(true)
  }

  const handleClose = () => {
    setIsPanelOpen(false)
    setSelected(undefined)
  }

  const columns = useMemo<ColumnDef<Property>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 200,
      size: 250,
      maxSize: 300,
      filterFn: 'text',
    },
    {
      id: 'fieldType',
      header: translation('type'),
      accessorFn: ({ fieldType }) => fieldType.toString(),
      cell: ({ row }) => {
        const value = row.original.fieldType

        return (
          <Chip className="coloring-tonal" color="primary">
            <span>{translation('sPropertyType', { type: value })}</span>
          </Chip>
        )
      },
      minSize: 160,
      size: 160,
      maxSize: 250,
      filterFn: 'text',
    },
    {
      id: 'subjectType',
      header: translation('subjectType'),
      accessorFn: ({ subjectType }) => subjectType.toString(),
      cell: ({ row }) => {
        const data = row.original
        return (
          <span className="typography-label-sm font-bold">
            {translation('sPropertySubjectType', { subject: data.subjectType })}
          </span>
        )
      },
      minSize: 200,
      size: 200,
      maxSize: 250,
      filterFn: 'text',
    },
    {
      id: 'active',
      header: translation('status'),
      accessorFn: ({ isArchived }) => !isArchived,
      cell: ({ row }) => {
        return (
          <Chip className="coloring-tonal" color={row.original.isArchived ? 'negative' : 'positive'}>
            {translation(row.original.isArchived ? 'inactive' : 'active')}
          </Chip>
        )
      },
      minSize: 100,
      size: 120,
      filterFn: 'boolean',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          layout="icon"
          coloringStyle="text"
          color="neutral"
          onClick={() => handleEdit(row.original)}
        >
          <EditIcon/>
        </Button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 77,
      minSize: 77,
      maxSize: 77
    }
  ], [translation])

  return (
    <Page pageTitle={titleWrapper(translation('properties'))}>
      <ContentPanel
        titleElement={translation('properties')}
        description={data ?  translation('nPatient', { count: data.length }) : (<LoadingContainer/>) }
        actionElement={(
          <Button onClick={handleAdd}>
            <PlusIcon/>
            {translation('rAdd', { name: translation('property') })}
          </Button>
        )}
      >
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <Table
            className="w-full h-full min-w-150"
            table={{
              data: data ?? [],
              columns,
              isUsingFillerRows: true,
              fillerRowCell: useCallback(() => (<FillerCell className="min-h-12"/>), []),
              initialState: {
                pagination: {
                  pageSize: 25,
                }
              }
            }}
          />
        </div>
      </ContentPanel>

      <Drawer
        alignment="right"
        titleElement={translation(!selected ? 'rAdd': 'rEdit', { name: translation('property') })}
        description={undefined}
        isOpen={isPanelOpen}
        onClose={handleClose}
      >
        <PropertyDetailView
          id={selected?.id}
          initialData={selected}
          onClose={handleClose}
          onSuccess={refetch}
        />
      </Drawer>
    </Page>
  )
}

export default PropertiesPage
