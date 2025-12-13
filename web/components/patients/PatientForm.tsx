import { useEffect, useMemo, useState } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { CreatePatientInput, Sex, useCreatePatientMutation, useGetLocationsQuery, useUpdatePatientMutation } from '@/api/gql/generated'
import { DatePicker, Input, Select, SolidButton } from '@helpwave/hightide'
import { useTasksContext } from '@/hooks/useTasksContext'

interface PatientFormProps {
  patientId?: string
  initialData?: Partial<CreatePatientInput>
  onClose: () => void
  onSuccess: () => void
}

export const PatientForm = ({ patientId, initialData, onClose, onSuccess }: PatientFormProps) => {
  const translation = useTasksTranslation()
  const { selectedLocationId } = useTasksContext()

  const [formData, setFormData] = useState<CreatePatientInput>({
    firstname: '',
    lastname: '',
    birthdate: new Date(),
    sex: Sex.Female,
    assignedLocationId: selectedLocationId ?? '',
    ...initialData
  })

  const { data: locationsData } = useGetLocationsQuery()
  const { mutate: createPatient, isPending: isCreating } = useCreatePatientMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })
  const { mutate: updatePatient, isPending: isUpdating } = useUpdatePatientMutation({
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const locationOptions = useMemo(() =>
    locationsData?.locationNodes?.map(l => ({ label: l.title, value: l.id })) ?? [],
    [locationsData])

  const sexOptions = [
    { label: translation('male'), value: Sex.Male },
    { label: translation('female'), value: Sex.Female },
    { label: translation('diverse'), value: Sex.Diverse }
  ]

  const handleSubmit = () => {
    if (patientId) {
      updatePatient({ id: patientId, data: formData })
    } else {
      createPatient({ data: formData })
    }
  }

  const isPending = isCreating || isUpdating

  return (
    <div className="flex flex-col gap-6">
      <Input
        label={translation('firstName')}
        value={formData.firstname}
        onChange={e => setFormData({ ...formData, firstname: e.target.value })}
      />
      <Input
        label={translation('lastName')}
        value={formData.lastname}
        onChange={e => setFormData({ ...formData, lastname: e.target.value })}
      />
      <DatePicker
        date={typeof formData.birthdate === 'string' ? new Date(formData.birthdate) : formData.birthdate}
        onDateChange={date => setFormData({ ...formData, birthdate: date })}
      />
      <Select
        items={sexOptions}
        selectedItem={sexOptions.find(o => o.value === formData.sex)}
        onSelectedItemChange={item => item && setFormData({ ...formData, sex: item.value })}
        itemToString={item => item.label}
        label={translation('sex')}
      />
      <Select
        items={locationOptions}
        selectedItem={locationOptions.find(o => o.value === formData.assignedLocationId)}
        onSelectedItemChange={item => item && setFormData({ ...formData, assignedLocationId: item.value })}
        itemToString={item => item.label}
        label={translation('location')}
      />
      <div className="flex justify-end gap-2 mt-4">
        <SolidButton
          color="neutral"
          onClick={onClose}
          disabled={isPending}
        >
          {translation('cancel')}
        </SolidButton>
        <SolidButton
          onClick={handleSubmit}
          disabled={isPending}
          loading={isPending}
        >
          {patientId ? translation('save') : translation('create')}
        </SolidButton>
      </div>
    </div>
  )
}
