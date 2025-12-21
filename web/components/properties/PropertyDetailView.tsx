import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  FormElementWrapper,
  Input,
  LoadingButton,
  Select,
  SelectOption,
  Textarea
} from '@helpwave/hightide'
import type { Property, PropertyFieldType, PropertySelectOption, PropertySubjectType } from '@/components/PropertyList'
import { propertyFieldTypeList, propertySubjectTypeList } from '@/components/PropertyList'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { PlusIcon, XIcon } from 'lucide-react'
import {
  useCreatePropertyDefinitionMutation,
  useUpdatePropertyDefinitionMutation,
  FieldType,
  PropertyEntity
} from '@/api/gql/generated'

interface PropertyDetailViewProps {
  id?: string,
  initialData?: Partial<Property>,
  onClose: () => void,
  onSuccess: () => void,
}

export const PropertyDetailView = ({
  id,
  initialData,
  onClose,
  onSuccess
}: PropertyDetailViewProps) => {
  const translation = useTasksTranslation()
  const isEditMode = !!id

  const [formData, setFormData] = useState<Property>({
    id: '',
    name: '',
    subjectType: 'patient',
    fieldType: 'singleSelect',
    description: '',
    isArchived: false,
    selectData: undefined,
    alwaysIncludeForViewSource: false,
    setId: '',
    ...initialData
  })
  const [newOption, setNewOption] = useState<PropertySelectOption>({
    id: '',
    name: '',
    description: '',
    isCustom: false,
  })

  useEffect(() => {
    if (initialData && !isEditMode) {
      const isSelectType = initialData.fieldType === 'multiSelect' || initialData.fieldType === 'singleSelect'
      const selectData = isSelectType && !initialData.selectData && initialData.fieldType ? {
        isAllowingFreetext: false,
        options: [],
      } : initialData.selectData

      setFormData(prev => ({
        ...prev,
        ...initialData,
        selectData,
      }))
    } else if (initialData && isEditMode && id && initialData.id === id) {
      const isSelectType = initialData.fieldType === 'multiSelect' || initialData.fieldType === 'singleSelect'
      const selectData = isSelectType && !initialData.selectData && initialData.fieldType ? {
        isAllowingFreetext: false,
        options: [],
      } : initialData.selectData

      setFormData(prev => {
        if (prev.id === id && prev.selectData?.options && selectData?.options) {
          const existingOptionNames = new Set(prev.selectData.options.map(o => o.name))
          const newOptionNames = new Set(selectData.options.map(o => o.name))
          const optionsChanged = prev.selectData.options.length !== selectData.options.length ||
            !prev.selectData.options.every(o => newOptionNames.has(o.name)) ||
            !selectData.options.every(o => existingOptionNames.has(o.name))

          if (!optionsChanged) {
            return prev
          }
        }
        return {
          ...prev,
          ...initialData,
          selectData,
        }
      })
    }
  }, [initialData, isEditMode, id])

  const mapFieldTypeToBackend = (fieldType: PropertyFieldType): FieldType => {
    const mapping: Record<PropertyFieldType, FieldType> = {
      text: FieldType.FieldTypeText,
      number: FieldType.FieldTypeNumber,
      checkbox: FieldType.FieldTypeCheckbox,
      date: FieldType.FieldTypeDate,
      dateTime: FieldType.FieldTypeDateTime,
      singleSelect: FieldType.FieldTypeSelect,
      multiSelect: FieldType.FieldTypeMultiSelect,
    }
    return mapping[fieldType]
  }

  const mapSubjectTypeToBackend = (subjectType: PropertySubjectType): PropertyEntity => {
    return subjectType === 'patient' ? PropertyEntity.Patient : PropertyEntity.Task
  }

  const { mutate: createProperty, isLoading: isCreating } = useCreatePropertyDefinitionMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  const { mutate: updateProperty, isLoading: isUpdating } = useUpdatePropertyDefinitionMutation({
    onSuccess: () => {
      onSuccess()
    }
  })

  const isLoading = isCreating || isUpdating

  const updateLocal = (updates: Partial<Property>) =>
    setFormData(prev => ({ ...prev, ...updates }))

  const persist = (updates: Partial<Property>) => {
    if (!isEditMode || !id) return

    const backendUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) backendUpdates['name'] = updates.name
    if (updates.description !== undefined) backendUpdates['description'] = updates.description
    if (updates.isArchived !== undefined) backendUpdates['isActive'] = !updates.isArchived
    if (updates.fieldType !== undefined) backendUpdates['fieldType'] = mapFieldTypeToBackend(updates.fieldType)
    if (updates.subjectType !== undefined) {
      backendUpdates['allowedEntities'] = [mapSubjectTypeToBackend(updates.subjectType)]
    }
    if (updates.selectData?.options !== undefined) {
      backendUpdates['options'] = updates.selectData.options.map(opt => opt.name)
    }

    updateProperty({
      id,
      data: backendUpdates
    })
  }

  const handleCreate = () => {
    if (!formData.name.trim()) return

    const createData = {
      name: formData.name,
      description: formData.description || null,
      fieldType: mapFieldTypeToBackend(formData.fieldType),
      allowedEntities: [mapSubjectTypeToBackend(formData.subjectType)],
      options: formData.selectData?.options.map(opt => opt.name) || null,
      isActive: !formData.isArchived,
    }

    createProperty({ data: createData })
  }

  const isSelectType = formData.fieldType === 'multiSelect' || formData.fieldType === 'singleSelect'

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="flex flex-col gap-6 pt-4">
          <FormElementWrapper label={translation('name')}>
            {({ ...bag }) => (
              <Input
                {...bag}
                value={formData.name}
                onChange={e => updateLocal({ name: e.target.value })}
                onBlur={() => persist({ name: formData.name })}
              />
            )}
          </FormElementWrapper>

          <FormElementWrapper label={translation('description')}>
            {({ ...bag }) => (
              <Textarea
                {...bag}
                value={formData.description ?? ''}
                onChange={e => updateLocal({ description: e.target.value })}
                onBlur={() => persist({ description: formData.description })}
              />
            )}
          </FormElementWrapper>

          <FormElementWrapper label={translation('subjectType')} disabled={isEditMode}>
            {({ ...bag }) => (
              <Select
                {...bag}
                value={formData.subjectType}
                onValueChanged={value => {
                  updateLocal({ subjectType: value as PropertySubjectType })
                  persist({ subjectType: value as PropertySubjectType })
                }}
              >
                {propertySubjectTypeList.map(v => (
                  <SelectOption key={v} value={v}>
                    {translation('sPropertySubjectType', { subject: v })}
                  </SelectOption>
                ))}
              </Select>
            )}
          </FormElementWrapper>

          <FormElementWrapper label={translation('type')} disabled={isEditMode}>
            {({ ...bag }) => (
              <Select
                {...bag}
                value={formData.fieldType}
                onValueChanged={value => {
                  updateLocal({ fieldType: value as PropertyFieldType })
                  persist({ fieldType: value as PropertyFieldType })
                }}
              >
                {propertyFieldTypeList.map(v => (
                  <SelectOption key={v} value={v}>
                    {translation('sPropertyType', { type: v })}
                  </SelectOption>
                ))}
              </Select>
            )}
          </FormElementWrapper>

          {isSelectType && (
            <div className="flex-col-2">
              <span className="typography-title-md">
                {translation('selectOptions')}
              </span>
              <div className="flex-col-2 min-h-64 max-h-64 overflow-y-auto">
                {formData.selectData?.options.map((option) => (
                  <div key={option.id} className="relative">
                    <Input
                      value={option.name}
                      onChangeText={value => {
                        setFormData(prev => {
                          if (!prev.selectData) return prev
                          return {
                            ...prev,
                            selectData: {
                              ...prev.selectData,
                              options: prev.selectData.options
                                .map(entry => entry.id === option.id ? { ...entry, name: value } : entry)
                            }
                          }
                        })
                      }}
                      onEditCompleted={value => {
                        const update = {
                          selectData: formData.selectData ? {
                            ...formData.selectData,
                            options: formData.selectData.options
                              .map(entry => entry.id === option.id ? { ...entry, name: value } : entry)
                          } : undefined
                        }
                        updateLocal(update)
                        persist(update)
                      }}
                      className="pr-11 w-full"
                    />
                    <Button
                      coloringStyle="text"
                      color="negative"
                      size="none"
                      className="absolute right-3 top-2 rounded"
                      onClick={() => {
                        const update = {
                          selectData: formData.selectData ? {
                            ...formData.selectData,
                            options: formData.selectData.options.filter(entry => entry.id !== option.id)
                          } : undefined
                        }
                        updateLocal(update)
                        persist(update)
                      }}
                    >
                      <XIcon />
                    </Button>
                  </div>
                ))}
                <div className="relative">
                  <Input
                    value={newOption.name}
                    onChangeText={name => {
                      setNewOption({
                        ...newOption,
                        name
                      })
                    }}
                    onEditCompleted={name => {
                      if (!name.trim()) return
                      const option = {
                        ...newOption,
                        id: `temp-${Date.now()}-${Math.random()}`,
                        name: name.trim()
                      }
                      setFormData(prev => {
                        const update = {
                          selectData: prev.selectData ? {
                            ...prev.selectData,
                            options: [...prev.selectData.options, option]
                          } : {
                            options: [option],
                            isAllowingFreetext: false,
                          }
                        }
                        const updatedFormData = {
                          ...prev,
                          ...update
                        }
                        setTimeout(() => {
                          persist(update)
                        }, 0)
                        return updatedFormData
                      })
                      setNewOption({
                        id: '',
                        name: '',
                        description: '',
                        isCustom: false,
                      })
                    }}
                    className="pr-16 w-full"
                    placeholder={translation('rAdd', { name: translation('option') })}
                  />
                  <Button
                    coloringStyle="text"
                    color="primary"
                    size="none"
                    className="absolute right-3 top-2 rounded"
                    disabled={!newOption.name}
                    onClick={() => {
                      if (!newOption.name.trim()) return
                      const option = {
                        ...newOption,
                        id: `temp-${Date.now()}-${Math.random()}`,
                        name: newOption.name.trim()
                      }
                      setFormData(prev => {
                        const update = {
                          selectData: prev.selectData ? {
                            ...prev.selectData,
                            options: [...prev.selectData.options, option]
                          } : {
                            options: [option],
                            isAllowingFreetext: false,
                          }
                        }
                        const updatedFormData = {
                          ...prev,
                          ...update
                        }
                        setTimeout(() => {
                          persist(update)
                        }, 0)
                        return updatedFormData
                      })
                      setNewOption({
                        id: '',
                        name: '',
                        description: '',
                        isCustom: false,
                      })
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </div>
            </div>
          )}
          {isEditMode && (
            <>

              <div className="flex-row-4 justify-between items-center">
                <div className="flex-col-1">
                  <span className="typography-title-md">
                    {translation('archiveProperty')}
                  </span>
                  <span className="text-description">
                    {translation('archivedPropertyDescription')}
                  </span>
                </div>
                <Checkbox
                  checked={formData.isArchived}
                  onCheckedChange={value => {
                    const update = { isArchived: value }
                    updateLocal(update)
                    persist(update)
                  }}
                />
              </div>

            </>
          )}
        </div>
        <div className="min-h-16" />
      </div>

      {!isEditMode && (
        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end">
          <LoadingButton onClick={handleCreate} isLoading={isLoading}>
            Create
          </LoadingButton>
        </div>
      )}
    </div>
  )
}
