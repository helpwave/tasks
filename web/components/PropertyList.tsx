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
  onPropertyValueChange?: (definitionId: string, value: PropertyValue | null) => void,
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
  const [localPropertyValues, setLocalPropertyValues] = useState<Map<string, PropertyValue>>(new Map())
  const [propertyToRemove, setPropertyToRemove] = useState<string | null>(null)
  const [removedPropertyIds, setRemovedPropertyIds] = useState<Set<string>>(new Set())
  const [pendingAdditions, setPendingAdditions] = useState<Map<string, { property: Property, value: PropertyValue }>>(new Map())

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
        subjectType: mapSubjectTypeFromBackend((def.allowedEntities && def.allowedEntities[0] ? def.allowedEntities[0] as PropertyEntity : PropertyEntity.Patient)),
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
        textValue: pv.textValue ?? undefined,
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

  useEffect(() => {
    const currentPropertyIds = new Set(attachedProperties.map(ap => ap.property.id))
    setRemovedPropertyIds(prev => {
      const next = new Set(prev)
      prev.forEach(id => {
        if (!currentPropertyIds.has(id)) {
          next.delete(id)
        }
      })
      return next
    })
    setPendingAdditions(prev => {
      const next = new Map(prev)
      prev.forEach((_, id) => {
        if (currentPropertyIds.has(id)) {
          next.delete(id)
        }
      })
      return next
    })
  }, [attachedProperties])

  const displayedProperties = useMemo(() => {
    const attachedPropertyIds = new Set(attachedProperties.map(ap => ap.property.id))
    const attached = attachedProperties
      .filter(ap => !removedPropertyIds.has(ap.property.id))
      .map(ap => {
        const localValue = localPropertyValues.get(ap.property.id)
        return {
          ...ap,
          value: localValue || ap.value,
        }
      })

    const pending = Array.from(pendingAdditions.values())
      .filter(pa => !removedPropertyIds.has(pa.property.id) && !attachedPropertyIds.has(pa.property.id))
      .map(pa => ({
        property: pa.property,
        subjectId,
        value: localPropertyValues.get(pa.property.id) || pa.value,
      }))

    const allProperties = [...attached, ...pending]
    const uniqueProperties = Array.from(
      new Map(allProperties.map(prop => [prop.property.id, prop])).values()
    )
    return uniqueProperties.sort((a, b) => a.property.name.localeCompare(b.property.name))
  }, [attachedProperties, localPropertyValues, removedPropertyIds, pendingAdditions, subjectId])

  const handlePropertyChange = (propertyId: string, value: PropertyValue) => {
    setLocalPropertyValues(prev => {
      const newMap = new Map(prev)
      newMap.set(propertyId, value)
      return newMap
    })

    if (onPropertyValueChange) {
      onPropertyValueChange(propertyId, value)
    }
  }

  const handlePropertyRemove = (propertyId: string) => {
    setRemovedPropertyIds(prev => new Set(prev).add(propertyId))
    setLocalPropertyValues(prev => {
      const newMap = new Map(prev)
      newMap.delete(propertyId)
      return newMap
    })

    if (onPropertyValueChange) {
      onPropertyValueChange(propertyId, null)
    }
    setPropertyToRemove(null)
  }

  const handleRemoveConfirm = () => {
    if (propertyToRemove) {
      handlePropertyRemove(propertyToRemove)
    }
  }

  const handleAddProperty = (property: Property) => {
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

    const defaultValue = getDefaultValue()
    setRemovedPropertyIds(prev => {
      const next = new Set(prev)
      next.delete(property.id)
      return next
    })
    setPendingAdditions(prev => {
      const next = new Map(prev)
      next.set(property.id, { property, value: defaultValue })
      return next
    })
    handlePropertyChange(property.id, defaultValue)
  }

  const isLoading = isLoadingDefinitions
  const isError = isErrorDefinitions

  const unattachedProperties = availableProperties.filter(prop =>
    !attachedProperties.some(attached => attached.property.id === prop.id) &&
    !pendingAdditions.has(prop.id))
  const hasUnattachedProperties = unattachedProperties.length > 0

  return (
    <LoadingAndErrorComponent
      isLoading={isLoading}
      hasError={isError}
      className="min-h-48"
    >
      <div className="flex-col-2 px-1 pt-2 pb-16">
        {displayedProperties.map((attachedProperty) => (
          <PropertyEntry
            key={attachedProperty.property.id}
            value={attachedProperty.value}
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
            onEditComplete={value => {
              handlePropertyChange(attachedProperty.property.id, value)
            }}
            onRemove={() => {
              setPropertyToRemove(attachedProperty.property.id)
            }}
          />
        ))}
        {fullWidthAddButton && (
          <div className="w-full">
            {hasUnattachedProperties ? (
              <Menu
                trigger={({ toggleOpen }, ref) => (
                  <Button
                    ref={ref}
                    onClick={toggleOpen}
                    className="w-full"
                  >
                    <Plus size={20} />
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
                    {unattachedProperties.map(property => (
                      <MenuItem
                        key={property.id}
                        onClick={() => {
                          handleAddProperty(property)
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
            ) : (
              <Button
                disabled={true}
                className="w-full"
              >
                <Plus size={20} />
                {translation('addProperty')}
              </Button>
            )}
          </div>
        )}
        {!fullWidthAddButton && hasUnattachedProperties && (
          <Menu
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
                {unattachedProperties.map(property => (
                  <MenuItem
                    key={property.id}
                    onClick={() => {
                      handleAddProperty(property)
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
