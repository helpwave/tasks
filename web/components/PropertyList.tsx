import { LoadingAndErrorComponent, LoadingAnimation, Menu, MenuItem } from '@helpwave/hightide'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useQuery } from '@tanstack/react-query'
import { PropertyEntry } from '@/components/PropertyEntry'

export const propertyFieldTypeList = ['multiSelect', 'singleSelect', 'number', 'text', 'date', 'dateTime', 'checkbox'] as const
export type PropertyFieldType = typeof propertyFieldTypeList[number]

export const propertySubjectTypeList = ['patient', 'task'] as const
export type PropertySubjectType = typeof propertySubjectTypeList[number]

export type PropertySelectOption = {
  id: string,
  name: string,
  description?: string,
  isCustom: boolean,
}

export type PropertySelectData = {
  isAllowingFreetext: boolean,
  options: PropertySelectOption[],
}

export type Property = {
  id: string,
  subjectType: PropertySubjectType,
  fieldType: PropertyFieldType,
  name: string,
  description?: string,
  isArchived: boolean,
  setId?: string,
  selectData?: PropertySelectData,
  alwaysIncludeForViewSource?: boolean,
}

export type PropertyValue = {
  textValue?: string,
  numberValue?: number,
  boolValue?: boolean,
  dateValue?: Date,
  dateTimeValue?: Date,
  singleSelectValue?: string,
  multiSelectValue?: string[],
}

export type AttachedProperty = {
  property: Property,
  subjectId: string,
  value: PropertyValue,
}

export const exampleProperties: Property[] = [
  {
    id: 'p1',
    subjectType: 'patient',
    fieldType: 'text',
    name: 'Allergies',
    isArchived: false,
  },
  {
    id: 'p2',
    subjectType: 'patient',
    fieldType: 'number',
    name: 'Height (cm)',
    isArchived: false,
  },
  {
    id: 'p3',
    subjectType: 'patient',
    fieldType: 'number',
    name: 'Weight (kg)',
    isArchived: false,
  },
  {
    id: 'p4',
    subjectType: 'patient',
    fieldType: 'checkbox',
    name: 'Smoker',
    isArchived: false,
  },
  {
    id: 'p5',
    subjectType: 'patient',
    fieldType: 'date',
    name: 'Date of Admission',
    isArchived: false,
  },
  {
    id: 'p6',
    subjectType: 'patient',
    fieldType: 'dateTime',
    name: 'Last Checkup',
    isArchived: false,
  },
  {
    id: 'p7',
    subjectType: 'patient',
    fieldType: 'singleSelect',
    name: 'Blood Type',
    isArchived: false,
    selectData: {
      isAllowingFreetext: false,
      options: [
        { id: 'bt-a', name: 'A', isCustom: false },
        { id: 'bt-b', name: 'B', isCustom: false },
        { id: 'bt-ab', name: 'AB', isCustom: false },
        { id: 'bt-o', name: 'O', isCustom: false },
      ],
    },
  },
  {
    id: 'p8',
    subjectType: 'patient',
    fieldType: 'multiSelect',
    name: 'Chronic Conditions',
    isArchived: false,
    selectData: {
      isAllowingFreetext: true,
      options: [
        { id: 'cc-diabetes', name: 'Diabetes', isCustom: false },
        { id: 'cc-asthma', name: 'Asthma', isCustom: false },
      ],
    },
  },
  {
    id: 'p9',
    subjectType: 'patient',
    fieldType: 'text',
    name: 'Primary Physician',
    isArchived: false,
  },
  {
    id: 'p10',
    subjectType: 'patient',
    fieldType: 'checkbox',
    name: 'Requires Isolation',
    isArchived: false,
  },
  {
    id: 'p11',
    subjectType: 'patient',
    fieldType: 'text',
    name: 'Insurance Number',
    isArchived: false,
  },
]

export const exampleAttachedProperties: AttachedProperty[] = [
  {
    property: exampleProperties[0]!,
    subjectId: 'patient-1',
    value: { textValue: 'Penicillin' },
  },
  {
    property: exampleProperties[1]!,
    subjectId: 'patient-1',
    value: { numberValue: 175 },
  },
  {
    property: exampleProperties[2]!,
    subjectId: 'patient-1',
    value: { numberValue: 72 },
  },
  {
    property: exampleProperties[3]!,
    subjectId: 'patient-1',
    value: { boolValue: false },
  },
  {
    property: exampleProperties[4]!,
    subjectId: 'patient-1',
    value: { dateValue: new Date('2025-01-10') },
  },
  {
    property: exampleProperties[5]!,
    subjectId: 'patient-1',
    value: { dateTimeValue: new Date('2025-12-01T09:30:00Z') },
  },
  {
    property: exampleProperties[6]!,
    subjectId: 'patient-1',
    value: { singleSelectValue: 'bt-o' },
  },
  {
    property: exampleProperties[7]!,
    subjectId: 'patient-1',
    value: { multiSelectValue: ['cc-diabetes'] },
  },
  {
    property: exampleProperties[8]!,
    subjectId: 'patient-1',
    value: { textValue: 'Dr. Smith' },
  },
]


export type PropertyListProps = {
  subjectId: string,
  subjectType: PropertySubjectType,
}

/**
 * A component for listing properties for a subject
 */
export const PropertyList = ({
  subjectId,
  subjectType
}: PropertyListProps) => {
  const translation = useTasksTranslation()
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['property', subjectType, subjectId],
    queryFn: () => {
      return {
        attached: exampleAttachedProperties,
        available: exampleProperties.slice(9)
      }
    }
  })

  const [attachedProperties, setAttachedProperties] = useState<AttachedProperty[]>([])

  useEffect(() => {
    if (data) {
      setAttachedProperties(
        data?.attached.sort((a, b) =>
          a.property.name.localeCompare(b.property.name)) ?? []
      )
    }
  }, [data])

  return (
    <LoadingAndErrorComponent
      isLoading={isLoading}
      hasError={isError}
      className="min-h-48"
    >
      <div className="flex-col-2">
        {attachedProperties.map((attachedProperty, index) => (
          <PropertyEntry
            key={index}
            value={attachedProperty.value}
            name={attachedProperty.property.name}
            fieldType={attachedProperty.property.fieldType}
            selectData={attachedProperty.property.selectData ?
              {
                onAddOption: () => {
                  // TODO add call
                },
                options: attachedProperty.property.selectData.options,
              } : undefined
            }
            onChange={value => setAttachedProperties(prevState => {
              return prevState.map(entry =>
                // TODO consider a better comparison as ids might be the same across different subjects types
                attachedProperty.property.id === entry.property.id ?
                  { ...entry, value } : entry)
            })}
            onEditComplete={() => {
              // TODO updater call
            }}
            onRemove={() => {
              // TODO remove call
            }}
          />
        ))}
        {data?.available && data.available.length > 0 && (
          <Menu<HTMLDivElement>
            trigger={({ toggleOpen }, ref) => (
              <div
                ref={ref}
                className="flex-row-4 px-4 py-2 items-center border-2 border-dashed bg-property-title-background text-property-title-text hover:border-primary rounded-xl cursor-pointer"
                onClick={toggleOpen}
              >
                <Plus size={20} />
                <span>{translation('addProperty')}</span>
              </div>
            )}
            menuClassName="min-w-[200px] p-2 "
            alignmentVertical="topOutside"
          >
            {({ close }) => (
              <LoadingAndErrorComponent
                isLoading={isLoading}
                hasError={isError}
                loadingComponent={<LoadingAnimation classname="min-h-20" />}
              >
                {/* TODO searchbar here, possibly in a new component for list search */}
                {data?.available.map(property => (
                  <MenuItem
                    key={property.id}
                    onClick={() => {
                      // TODO handle new property added
                      close()
                    }}
                    className="rounded-md cursor-pointer"
                  >
                    {property.name}
                  </MenuItem>
                ))}
              </LoadingAndErrorComponent>
            )}
          </Menu>
        )}
      </div>
    </LoadingAndErrorComponent>
  )
}
