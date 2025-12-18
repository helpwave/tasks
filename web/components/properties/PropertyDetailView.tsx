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
import { ValidatedFormElementWrapper } from '@/components/ui/Form'
import type { Property, PropertyFieldType, PropertySelectOption, PropertySubjectType } from '@/components/PropertyList'
import { propertyFieldTypeList, propertySubjectTypeList } from '@/components/PropertyList'
import { useMutation } from '@tanstack/react-query'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { PlusIcon, XIcon } from 'lucide-react'

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
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const { mutate: createProperty, isLoading } = useMutation({
    mutationFn: ({ data: property }: { data: Property }) => {
      return new Promise(() => property)
    },
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  const { mutate: updateProperty } = useMutation({
    mutationFn: ({ data: property }: { id: string, data: Partial<Property> }) => {
      return new Promise(() => property)
    },
    onSuccess: () => {
      onSuccess()
    }
  })

  const updateLocal = (updates: Partial<Property>) =>
    setFormData(prev => ({ ...prev, ...updates }))

  const persist = (updates: Partial<Property>) => {
    if (!isEditMode || !id) return
    updateProperty({ id, data: updates })
  }

  const handleCreate = () => {
    if (!formData.name.trim()) return
    createProperty({ data: formData })
  }

  const isSelectType = formData.fieldType === 'multiSelect' || formData.fieldType === 'singleSelect'

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="flex flex-col gap-6 pt-4">
          <ValidatedFormElementWrapper
            label={translation('name')}
            value={formData.name}
            required={true}
          >
            {({ invalid, ...bag }) => (
              <Input
                {...bag}
                value={formData.name}
                onChange={e => updateLocal({ name: e.target.value })}
                onBlur={() => persist({ name: formData.name })}
                invalid={invalid}
              />
            )}
          </ValidatedFormElementWrapper>

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
                        const update = {
                          selectData: formData.selectData ? {
                            ...formData.selectData,
                            options: formData.selectData.options
                              .map(entry => entry.id === option.id ? { ...entry, name: value } : entry)
                          } : undefined
                        }
                        updateLocal(update)
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
                      const option = {
                        ...newOption,
                        name
                      }
                      const update = {
                        selectData: formData.selectData ? {
                          ...formData.selectData,
                          options: [...formData.selectData.options, option]
                        } : {
                          options: [option],
                          isAllowingFreetext: false,
                        }
                      }
                      updateLocal(update)
                      persist(update)
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
                      const update = {
                        selectData: formData.selectData ? {
                          ...formData.selectData,
                          options: [...formData.selectData.options, newOption]
                        } : {
                          options: [newOption],
                          isAllowingFreetext: false,
                        }
                      }
                      updateLocal(update)
                      persist(update)
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
