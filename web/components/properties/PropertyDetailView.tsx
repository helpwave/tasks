import { useEffect, useState, useRef } from 'react'
import type { FormFieldDataHandling } from '@helpwave/hightide'
import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectOption,
  Textarea,
  FormField,
  FormProvider,
  useCreateForm,
  FormObserverKey
} from '@helpwave/hightide'
import type { Property, PropertyFieldType, PropertySelectOption, PropertySubjectType } from '@/components/PropertyList'
import { propertyFieldTypeList, propertySubjectTypeList } from '@/components/PropertyList'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { PlusIcon, XIcon } from 'lucide-react'
import { useCreatePropertyMutation, useUpdatePropertyMutation } from '@/api/mutations/properties'
import { FieldType, PropertyEntity } from '@/api/types'

interface PropertyDetailViewProps {
  id?: string,
  initialData?: Partial<Property>,
  onClose: () => void,
  onSuccess: () => void,
}

type PropertyFormValues = {
  name: string,
  description: string,
  subjectType: PropertySubjectType,
  fieldType: PropertyFieldType,
  isArchived: boolean,
  selectData?: {
    isAllowingFreetext: boolean,
    options: PropertySelectOption[],
  },
}

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

export const PropertyDetailView = ({
  id,
  initialData,
  onClose,
  onSuccess
}: PropertyDetailViewProps) => {
  const translation = useTasksTranslation()
  const isEditMode = !!id

  const [newOption, setNewOption] = useState<PropertySelectOption>({
    id: '',
    name: '',
    description: '',
    isCustom: false,
  })

  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [createPropertyMutation] = useCreatePropertyMutation()

  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [updatePropertyMutation] = useUpdatePropertyMutation()
      onSuccess()
    }
  })

  const persist = (updates: Partial<PropertyFormValues>) => {
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

    setIsUpdating(true)
    try {
      await updatePropertyMutation({ variables: { id, data: backendUpdates } })
      onSuccess()
    } catch (error) {
      console.error('Failed to update property', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const isLoading = isCreating || isUpdating

  const form = useCreateForm<PropertyFormValues>({
    initialValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      subjectType: initialData?.subjectType || 'patient',
      fieldType: initialData?.fieldType || 'singleSelect',
      isArchived: initialData?.isArchived || false,
      selectData: initialData?.selectData || (initialData?.fieldType === 'multiSelect' || initialData?.fieldType === 'singleSelect' ? {
        isAllowingFreetext: false,
        options: [],
      } : undefined),
    },
    onFormSubmit: (values) => {
      if (!values.name.trim()) return

      const createData = {
        name: values.name,
        description: values.description || null,
        fieldType: mapFieldTypeToBackend(values.fieldType),
        allowedEntities: [mapSubjectTypeToBackend(values.subjectType)],
        options: values.selectData?.options.map(opt => opt.name) || null,
        isActive: !values.isArchived,
      }

      setIsCreating(true)
      try {
        await createPropertyMutation({ variables: { data: createData } })
        onSuccess()
        onClose()
      } catch (error) {
        console.error('Failed to create property', error)
      } finally {
        setIsCreating(false)
      }
    },
    validators: {
      name: (value) => {
        if (!value || !value.trim()) {
          return translation('name') + ' is required'
        }
        return null
      },
    },
    onValidUpdate: (_, updates) => {
      if (!isEditMode) return
      persist(updates)
    }
  })

  const { update: updateForm } = form
  const updateFormRef = useRef(updateForm)
  updateFormRef.current = updateForm

  useEffect(() => {
    if (initialData && !isEditMode) {
      const isSelectType = initialData.fieldType === 'multiSelect' || initialData.fieldType === 'singleSelect'
      const selectData = isSelectType && !initialData.selectData && initialData.fieldType ? {
        isAllowingFreetext: false,
        options: [],
      } : initialData.selectData

      updateFormRef.current(prev => ({
        ...prev,
        name: initialData.name || '',
        description: initialData.description || '',
        subjectType: initialData.subjectType || 'patient',
        fieldType: initialData.fieldType || 'singleSelect',
        isArchived: initialData.isArchived || false,
        selectData,
      }))
    } else if (initialData && isEditMode && id && initialData.id === id) {
      const isSelectType = initialData.fieldType === 'multiSelect' || initialData.fieldType === 'singleSelect'
      const selectData = isSelectType && !initialData.selectData && initialData.fieldType ? {
        isAllowingFreetext: false,
        options: [],
      } : initialData.selectData

      updateFormRef.current(prev => {
        if (prev.selectData?.options && selectData?.options) {
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
          name: initialData.name || '',
          description: initialData.description || '',
          subjectType: initialData.subjectType || 'patient',
          fieldType: initialData.fieldType || 'singleSelect',
          isArchived: initialData.isArchived || false,
          selectData,
        }
      })
    }
  }, [initialData, isEditMode, id])






  return (
    <FormProvider state={form}>
      <div className="flex flex-col h-full bg-surface">
        <div className="flex-grow overflow-hidden flex flex-col">
          <form onSubmit={event => { event.preventDefault(); form.submit() }}>
            <div className="flex flex-col gap-6 pt-4">
              <FormField<PropertyFormValues, 'name'>
                name="name"
                label={translation('name')}
                required
              >
                {({ dataProps, focusableElementProps, interactionStates }) => (
                  <Input
                    {...dataProps} {...focusableElementProps} {...interactionStates}
                    value={dataProps.value || ''}
                  />
                )}
              </FormField>

              <FormField<PropertyFormValues, 'description'>
                name="description"
                label={translation('description')}
              >
                {({ dataProps, focusableElementProps, interactionStates }) => (
                  <Textarea
                    {...dataProps} {...focusableElementProps} {...interactionStates}
                    value={dataProps.value || ''}
                  />
                )}
              </FormField>

              <FormField<PropertyFormValues, 'subjectType'>
                name="subjectType"
                label={translation('subjectType')}
              >
                {({ dataProps, focusableElementProps, interactionStates }) => (
                  <Select
                    {...dataProps as FormFieldDataHandling<string>} {...focusableElementProps} {...interactionStates}
                    value={dataProps.value || 'patient'}
                    disabled={isEditMode}
                    onValueChange={(value) => {
                      const subjectType = value as PropertySubjectType
                      dataProps.onValueChange?.(subjectType)
                      dataProps.onEditComplete?.(subjectType)
                      if (isEditMode && id) {
                        persist({ subjectType })
                      }
                    }}
                  >
                    {propertySubjectTypeList.map(v => (
                      <SelectOption key={v} value={v}>
                        {translation('sPropertySubjectType', { subject: v })}
                      </SelectOption>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormField<PropertyFormValues, 'fieldType'>
                name="fieldType"
                label={translation('type')}
              >
                {({ dataProps, focusableElementProps, interactionStates }) => (
                  <Select
                    {...dataProps as FormFieldDataHandling<string>} {...focusableElementProps} {...interactionStates}
                    value={dataProps.value || 'singleSelect'}
                    disabled={isEditMode}
                    onValueChange={(value) => {
                      const fieldType = value as PropertyFieldType
                      const isSelectType = fieldType === 'multiSelect' || fieldType === 'singleSelect'
                      const currentSelectData = form.store.get('selectData')
                      const selectData = isSelectType && !currentSelectData ? {
                        isAllowingFreetext: false,
                        options: [],
                      } : currentSelectData
                      dataProps.onValueChange?.(fieldType)
                      updateForm(prev => ({
                        ...prev,
                        fieldType,
                        selectData,
                      }))
                      dataProps.onEditComplete?.(fieldType)
                      if (isEditMode && id) {
                        persist({ fieldType, selectData })
                      }
                    }}
                  >
                    {propertyFieldTypeList.map(v => (
                      <SelectOption key={v} value={v}>
                        {translation('sPropertyType', { type: v })}
                      </SelectOption>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormObserverKey<PropertyFormValues, 'fieldType'> key="fieldType">
                {({ value: fieldType }) => {
                  const isSelectType = fieldType === 'multiSelect' || fieldType === 'singleSelect'
                  if (!isSelectType) return null
                  return (
                    <div className="flex-col-2">
                      <span className="typography-title-md">
                        {translation('selectOptions')}
                      </span>
                      <div className="flex-col-2 min-h-64 max-h-64 overflow-y-auto">
                        <FormObserverKey<PropertyFormValues, 'selectData'> key="selectData">
                          {({ value: selectData }) => {
                            if (!selectData?.options) return null
                            return selectData.options.map((option) => (
                              <div key={option.id} className="relative">
                                <Input
                                  value={option.name}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    updateForm(prev => {
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
                                  onBlur={(e) => {
                                    const value = e.target.value
                                    const update = {
                                      selectData: selectData ? {
                                        ...selectData,
                                        options: selectData.options
                                          .map(entry => entry.id === option.id ? { ...entry, name: value } : entry)
                                      } : undefined
                                    }
                                    updateForm(prev => ({ ...prev, ...update }))
                                    persist(update)
                                  }}
                                  className="pr-11 w-full"
                                />
                                <Button
                                  coloringStyle="text"
                                  color="negative"
                                  size="sm"
                                  layout="icon"
                                  className="absolute right-1 top-1 rounded"
                                  onClick={() => {
                                    const update = {
                                      selectData: selectData ? {
                                        ...selectData,
                                        options: selectData.options.filter(entry => entry.id !== option.id)
                                      } : undefined
                                    }
                                    updateForm(prev => ({ ...prev, ...update }))
                                    persist(update)
                                  }}
                                >
                                  <XIcon />
                                </Button>
                              </div>
                            ))
                          }}
                        </FormObserverKey>
                        <FormObserverKey<PropertyFormValues, 'selectData'> key="selectData">
                          {({ value: selectData }) => {
                            return (
                              <div className="relative">
                                <Input
                                  value={newOption.name}
                                  onChange={(e) => {
                                    const name = e.target.value
                                    setNewOption({
                                      ...newOption,
                                      name
                                    })
                                  }}
                                  onBlur={(e) => {
                                    const name = e.target.value.trim()
                                    if (!name) return
                                    const option = {
                                      ...newOption,
                                      id: `temp-${Date.now()}-${Math.random()}`,
                                      name
                                    }
                                    const currentSelectData = selectData
                                    const update = {
                                      selectData: currentSelectData ? {
                                        ...currentSelectData,
                                        options: [...currentSelectData.options, option]
                                      } : {
                                        options: [option],
                                        isAllowingFreetext: false,
                                      }
                                    }
                                    updateForm(prev => ({ ...prev, ...update }))
                                    setTimeout(() => {
                                      persist(update)
                                    }, 0)
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
                                  size="sm"
                                  layout="icon"
                                  className="absolute right-1 top-1 rounded"
                                  disabled={!newOption.name}
                                  onClick={() => {
                                    if (!newOption.name.trim()) return
                                    const option = {
                                      ...newOption,
                                      id: `temp-${Date.now()}-${Math.random()}`,
                                      name: newOption.name.trim()
                                    }
                                    const currentSelectData = selectData
                                    const update = {
                                      selectData: currentSelectData ? {
                                        ...currentSelectData,
                                        options: [...currentSelectData.options, option]
                                      } : {
                                        options: [option],
                                        isAllowingFreetext: false,
                                      }
                                    }
                                    updateForm(prev => ({ ...prev, ...update }))
                                    setTimeout(() => {
                                      persist(update)
                                    }, 0)
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
                            )
                          }}
                        </FormObserverKey>
                      </div>
                    </div>
                  )
                }}
              </FormObserverKey>
              {isEditMode && (
                <FormField<PropertyFormValues, 'isArchived'>
                  name="isArchived"
                  label={translation('archiveProperty')}
                >
                  {({ dataProps: { value, onValueChange }, focusableElementProps, interactionStates }) => (
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
                        {...focusableElementProps} {...interactionStates}
                        value={value || false}
                        onValueChange={(checked) => {
                          onValueChange?.(checked)
                          if (isEditMode && id) {
                            persist({ isArchived: checked })
                          }
                        }}
                      />
                    </div>
                  )}
                </FormField>
              )}
            </div>
            <div className="min-h-16" />
          </form>
        </div>

        {!isEditMode && (
          <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end">
            <Button
              type="submit"
              onClick={() => form.submit()}
              disabled={isLoading}
            >
              {translation('create')}
            </Button>
          </div>
        )}
      </div>
    </FormProvider>
  )
}
