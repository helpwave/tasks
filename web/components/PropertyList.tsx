import { LoadingAndErrorComponent, LoadingAnimation, Menu, MenuItem, ConfirmDialog, Button } from '@helpwave/hightide'
import { Plus } from 'lucide-react'
import React, { useMemo, useState, useEffect } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { PropertyEntry } from '@/components/PropertyEntry'
import { useGetPropertyDefinitionsQuery, FieldType, PropertyEntity } from '@/api/gql/generated'

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
  propertyValues?: Array<{
    definition: {
      id: string,
      name: string,
      description?: string | null,
      fieldType: string,
      isActive: boolean,
      allowedEntities: string[],
      options: string[],
    },
    textValue?: string | null,
    numberValue?: number | null,
    booleanValue?: boolean | null,
    dateValue?: string | null,
    dateTimeValue?: string | null,
    selectValue?: string | null,
    multiSelectValues?: string[] | null,
  }>,
  onPropertyValueChange?: (definitionId: string, value: PropertyValue) => void,
  fullWidthAddButton?: boolean,
}

const mapFieldTypeFromBackend = (fieldType: FieldType): PropertyFieldType => {
  const mapping: Record<FieldType, PropertyFieldType> = {
    [FieldType.FieldTypeText]: 'text',
    [FieldType.FieldTypeNumber]: 'number',
    [FieldType.FieldTypeCheckbox]: 'checkbox',
    [FieldType.FieldTypeDate]: 'date',
    [FieldType.FieldTypeDateTime]: 'dateTime',
    [FieldType.FieldTypeSelect]: 'singleSelect',
    [FieldType.FieldTypeMultiSelect]: 'multiSelect',
    [FieldType.FieldTypeUnspecified]: 'text',
  }
  return mapping[fieldType] || 'text'
}

const mapSubjectTypeFromBackend = (entity: PropertyEntity): PropertySubjectType => {
  return entity === PropertyEntity.Patient ? 'patient' : 'task'
}

export const PropertyList = ({
  subjectId,
  subjectType,
  propertyValues = [],
  onPropertyValueChange,
  fullWidthAddButton = false,
}: PropertyListProps) => {
  const translation = useTasksTranslation()

  const { data: propertyDefinitionsData, isLoading: isLoadingDefinitions, isError: isErrorDefinitions } = useGetPropertyDefinitionsQuery()

  const availableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return []

    const entity = subjectType === 'patient' ? PropertyEntity.Patient : PropertyEntity.Task

    return propertyDefinitionsData.propertyDefinitions
      .filter(def => def.isActive && def.allowedEntities.includes(entity))
      .map(def => ({
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
      } as Property))
  }, [propertyDefinitionsData, subjectType])

  const attachedProperties = useMemo(() => {
    if (!propertyValues || propertyValues.length === 0) return []

    const seenDefinitionIds = new Map<string, typeof propertyValues[0]>()
    propertyValues.forEach(pv => {
      const defId = pv.definition.id
      if (!seenDefinitionIds.has(defId)) {
        seenDefinitionIds.set(defId, pv)
      }
    })

    return Array.from(seenDefinitionIds.values()).map(pv => {
      const def = pv.definition
      const property: Property = {
        id: def.id,
        name: def.name,
        description: def.description || undefined,
        subjectType: mapSubjectTypeFromBackend(def.allowedEntities[0] as PropertyEntity || PropertyEntity.Patient),
        fieldType: mapFieldTypeFromBackend(def.fieldType as FieldType),
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
      }

      const value: PropertyValue = {
        textValue: pv.textValue || undefined,
        numberValue: pv.numberValue || undefined,
        boolValue: pv.booleanValue || undefined,
        dateValue: pv.dateValue ? (() => {
          const date = new Date(pv.dateValue)
          return !isNaN(date.getTime()) ? date : undefined
        })() : undefined,
        dateTimeValue: pv.dateTimeValue ? (() => {
          const date = new Date(pv.dateTimeValue)
          return !isNaN(date.getTime()) ? date : undefined
        })() : undefined,
        singleSelectValue: pv.selectValue || undefined,
        multiSelectValue: pv.multiSelectValues || undefined,
      }

      return {
        property,
        subjectId,
        value,
      } as AttachedProperty
    }).sort((a, b) => a.property.name.localeCompare(b.property.name))
  }, [propertyValues, subjectId])

  const [localPropertyValues, setLocalPropertyValues] = useState<Map<string, PropertyValue>>(new Map())
  const [propertyToRemove, setPropertyToRemove] = useState<string | null>(null)

  useEffect(() => {
    const newMap = new Map<string, PropertyValue>()
    attachedProperties.forEach(ap => {
      newMap.set(ap.property.id, ap.value)
    })
    setLocalPropertyValues(newMap)
  }, [attachedProperties])

  const isLoading = isLoadingDefinitions
  const isError = isErrorDefinitions

  const handleRemoveConfirm = () => {
    if (propertyToRemove && onPropertyValueChange) {
      const emptyValue: PropertyValue = {}
      onPropertyValueChange(propertyToRemove, emptyValue)
      setLocalPropertyValues(prev => {
        const newMap = new Map(prev)
        newMap.delete(propertyToRemove)
        return newMap
      })
    }
    setPropertyToRemove(null)
  }

  return (
    <LoadingAndErrorComponent
      isLoading={isLoading}
      hasError={isError}
      className="min-h-48"
    >
      <div className="flex-col-2">
        {attachedProperties.map((attachedProperty, index) => {
          const localValue = localPropertyValues.get(attachedProperty.property.id) || attachedProperty.value

          return (
            <PropertyEntry
              key={index}
              value={localValue}
              name={attachedProperty.property.name}
              fieldType={attachedProperty.property.fieldType}
              selectData={attachedProperty.property.selectData ?
                {
                  onAddOption: () => {
                  },
                  options: attachedProperty.property.selectData.options,
                } : undefined
              }
              onChange={value => {
                setLocalPropertyValues(prev => {
                  const newMap = new Map(prev)
                  newMap.set(attachedProperty.property.id, value)
                  return newMap
                })
              }}
              onEditComplete={(value) => {
                if (onPropertyValueChange) {
                  onPropertyValueChange(attachedProperty.property.id, value)
                }
              }}
              onRemove={() => {
                setPropertyToRemove(attachedProperty.property.id)
              }}
            />
          )
        })}
        {fullWidthAddButton && (
          <div className="w-full">
            {availableProperties.length > 0 ? (
              <Menu<HTMLButtonElement>
                trigger={({ toggleOpen }, ref) => (
                  <Button
                    ref={ref}
                    startIcon={<Plus size={20} />}
                    onClick={toggleOpen}
                    className="w-full"
                  >
                    {translation('addProperty')}
                  </Button>
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
                  {availableProperties
                    .filter(prop => !attachedProperties.some(attached => attached.property.id === prop.id))
                    .map(property => {
                      const getDefaultValue = (): PropertyValue => {
                        switch (property.fieldType) {
                          case 'text':
                            return { textValue: '' }
                          case 'number':
                            return { numberValue: undefined }
                          case 'checkbox':
                            return { boolValue: false }
                          case 'date':
                          case 'dateTime':
                            return {}
                          case 'singleSelect':
                            return property.selectData?.options && property.selectData.options.length > 0
                              ? { singleSelectValue: property.selectData.options[0]?.id || undefined }
                              : {}
                          case 'multiSelect':
                            return { multiSelectValue: [] }
                          default:
                            return {}
                        }
                      }

                      return (
                        <MenuItem
                          key={property.id}
                          onClick={() => {
                            if (onPropertyValueChange) {
                              const defaultValue = getDefaultValue()
                              onPropertyValueChange(property.id, defaultValue)
                            }
                            close()
                          }}
                          className="rounded-md cursor-pointer"
                        >
                          {property.name}
                        </MenuItem>
                      )
                    })}
                </LoadingAndErrorComponent>
              )}
              </Menu>
            ) : (
              <Button
                startIcon={<Plus size={20} />}
                disabled={true}
                className="w-full"
              >
                {translation('addProperty')}
              </Button>
            )}
          </div>
        )}
        {!fullWidthAddButton && (
          availableProperties.length > 0 && (
            <Menu<HTMLDivElement>
              trigger={({ toggleOpen }, ref) => (
                <div
                  ref={ref as React.RefObject<HTMLDivElement>}
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
                  {availableProperties
                    .filter(prop => !attachedProperties.some(attached => attached.property.id === prop.id))
                    .map(property => {
                      const getDefaultValue = (): PropertyValue => {
                        switch (property.fieldType) {
                          case 'text':
                            return { textValue: '' }
                          case 'number':
                            return { numberValue: undefined }
                          case 'checkbox':
                            return { boolValue: false }
                          case 'date':
                          case 'dateTime':
                            return {}
                          case 'singleSelect':
                            return property.selectData?.options && property.selectData.options.length > 0
                              ? { singleSelectValue: property.selectData.options[0]?.id || undefined }
                              : {}
                          case 'multiSelect':
                            return { multiSelectValue: [] }
                          default:
                            return {}
                        }
                      }

                      return (
                        <MenuItem
                          key={property.id}
                          onClick={() => {
                            if (onPropertyValueChange) {
                              const defaultValue = getDefaultValue()
                              onPropertyValueChange(property.id, defaultValue)
                            }
                            close()
                          }}
                          className="rounded-md cursor-pointer"
                        >
                          {property.name}
                        </MenuItem>
                      )
                    })}
                </LoadingAndErrorComponent>
              )}
            </Menu>
          )
        )}
      </div>
      <ConfirmDialog
        isOpen={propertyToRemove !== null}
        onCancel={() => setPropertyToRemove(null)}
        onConfirm={handleRemoveConfirm}
        titleElement={translation('removeProperty')}
        description={translation('removePropertyConfirmation')}
        confirmType="negative"
      />
    </LoadingAndErrorComponent>
  )
}
