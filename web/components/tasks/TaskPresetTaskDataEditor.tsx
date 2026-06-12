import { useEffect, useMemo } from 'react'
import type { FormFieldDataHandling } from '@helpwave/hightide'
import {
  Button,
  FormField,
  FormProvider,
  Input,
  Select,
  SelectOption,
  Textarea,
  useCreateForm
} from '@helpwave/hightide'
import type { TaskPriority } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { mergeTaskPresetTask, type TaskPresetTask } from '@/utils/taskGraph'
import { PriorityUtils } from '@/utils/priority'

type TaskPresetTaskDataEditorProps = {
  formKey: string,
  initialTaskPresetTask?: Partial<TaskPresetTask>,
  onSave: (task: TaskPresetTask) => void,
}

export function TaskPresetTaskDataEditor({
  formKey,
  initialTaskPresetTask,
  onSave,
}: TaskPresetTaskDataEditorProps) {
  const translation = useTasksTranslation()

  const initialValues = useMemo(
    () => mergeTaskPresetTask(initialTaskPresetTask),
    [initialTaskPresetTask]
  )

  const form = useCreateForm<TaskPresetTask>({
    initialValues,
    onFormSubmit: (values) => {
      onSave({
        title: values.title.trim(),
        description: (values.description ?? '').trim(),
        priority: (values.priority as TaskPriority | null) || null,
        estimatedTime: values.estimatedTime ?? null,
      })
    },
    validators: {
      title: (value) => {
        if (!value || !value.trim()) {
          return translation('taskTitlePlaceholder') + ' is required'
        }
        return null
      },
    },
  })

  const { update: updateForm } = form

  useEffect(() => {
    updateForm(() => mergeTaskPresetTask(initialTaskPresetTask))
  }, [formKey, initialTaskPresetTask, updateForm])

  const priorities = [
    { value: 'P1', label: translation('sPriority', { priority: 'P1' }) },
    { value: 'P2', label: translation('sPriority', { priority: 'P2' }) },
    { value: 'P3', label: translation('sPriority', { priority: 'P3' }) },
    { value: 'P4', label: translation('sPriority', { priority: 'P4' }) },
  ]

  return (
    <FormProvider state={form}>
      <form
        onSubmit={event => { event.preventDefault(); form.submit() }}
        className="flex flex-col overflow-hidden"
        noValidate
      >
        <div className="flex flex-col gap-6 pt-4 overflow-y-auto px-2 pb-28">
          <FormField<TaskPresetTask, 'title'>
            name="title"
            label={translation('task')}
            required
            showRequiredIndicator
          >
            {({ dataProps, focusableElementProps, interactionStates }) => (
              <Input
                {...dataProps} {...focusableElementProps} {...interactionStates}
                placeholder={translation('taskTitlePlaceholder')}
                className="flex-1 text-lg py-3"
              />
            )}
          </FormField>

          <FormField<TaskPresetTask, 'priority'>
            name="priority"
            label={translation('priorityLabel') ?? 'Priority'}
          >
            {({ dataProps, focusableElementProps, interactionStates }) => {
              const priorityValue = dataProps.value || 'none'
              return (
                <Select
                  {...dataProps as FormFieldDataHandling<string>} {...focusableElementProps} {...interactionStates}
                  value={priorityValue === null ? 'none' : priorityValue}
                  onValueChange={(value) => {
                    const priority = value === 'none' ? null : (value as TaskPriority)
                    dataProps.onValueChange?.(priority)
                    dataProps.onEditComplete?.(priority)
                  }}
                >
                  <SelectOption value="none" iconAppearance="right" label={translation('priorityNone')} />
                  {priorities.map(({ value, label }) => (
                    <SelectOption key={value} value={value} iconAppearance="right" label={label}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${PriorityUtils.toBackgroundColor(value as TaskPriority | null | undefined)}`} />
                        <span>{label}</span>
                      </div>
                    </SelectOption>
                  ))}
                </Select>
              )
            }}
          </FormField>

          <FormField<TaskPresetTask, 'estimatedTime'>
            name="estimatedTime"
            label={translation('estimatedTime') ?? 'Estimated Time (minutes)'}
          >
            {({ dataProps: { value, onValueChange, onEditComplete }, focusableElementProps, interactionStates }) => (
              <Input
                {...focusableElementProps} {...interactionStates}
                type="number"
                min="0"
                step="1"
                value={value?.toString() || ''}
                placeholder="e.g. 30"
                onChange={(e) => {
                  const numValue = e.target.value === '' ? null : parseInt(e.target.value, 10)
                  onValueChange?.(isNaN(numValue as number) ? null : numValue)
                }}
                onBlur={() => {
                  onEditComplete?.(value)
                }}
              />
            )}
          </FormField>

          <FormField<TaskPresetTask, 'description'>
            name="description"
            label={translation('description')}
          >
            {({ dataProps, focusableElementProps, interactionStates }) => (
              <Textarea
                {...dataProps} {...focusableElementProps} {...interactionStates}
                value={dataProps.value || ''}
                placeholder={translation('descriptionPlaceholder')}
              />
            )}
          </FormField>
        </div>

        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2 px-2 pb-4">
          <Button onClick={form.submit} color="primary">
            {translation('taskPresetApplyToRow')}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
