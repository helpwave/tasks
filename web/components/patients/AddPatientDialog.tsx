import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Dialog, Button, Input, Select, DatePicker } from '@helpwave/hightide'
import { CreatePatientDocument, GetPatientsDocument, Sex } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

interface AddPatientDialogProps {
  isOpen: boolean
  onClose: () => void
  currentLocationId: string | null
}

export const AddPatientDialog: React.FC<AddPatientDialogProps> = ({ isOpen, onClose, currentLocationId }) => {
  const t = useTasksTranslation()

  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [birthdate, setBirthdate] = useState<Date | null>(null)
  const [sex, setSex] = useState<Sex | ''>('')

  const [createPatient, { loading }] = useMutation(CreatePatientDocument, {
    onCompleted: () => {
      resetForm()
      onClose()
    },
    refetchQueries: [GetPatientsDocument],
    onError: (error) => {
      console.error(error)
    }
  })

  const resetForm = () => {
    setFirstname('')
    setLastname('')
    setBirthdate(null)
    setSex('')
  }

  const handleSave = () => {
    if (!firstname || !lastname || !birthdate || !sex) return

    createPatient({
      variables: {
        data: {
          firstname,
          lastname,
          birthdate: birthdate.toISOString().split('T')[0],
          sex: sex as Sex,
          assignedLocationId: currentLocationId
        }
      }
    })
  }

  const sexOptions = [
    { value: Sex.Male, label: t('addPatient_sex_male') },
    { value: Sex.Female, label: t('addPatient_sex_female') },
    { value: Sex.Unknown, label: t('addPatient_sex_diverse') },
  ]

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('addPatient_title')}
      size="medium"
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex gap-4">
          <Input
            label={t('addPatient_firstname')}
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            autoFocus
            className="flex-1"
          />
          <Input
            label={t('addPatient_lastname')}
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <DatePicker
              label={t('addPatient_birthdate')}
              date={birthdate}
              onDateChange={setBirthdate}
            />
          </div>
          <div className="flex-1">
            <Select
              label={t('addPatient_sex')}
              options={sexOptions}
              value={sex}
              onChange={(val) => setSex(val as Sex)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {t('common_cancel')}
          </Button>
          <Button
            variant="solid"
            onClick={handleSave}
            loading={loading}
            disabled={!firstname || !lastname || !birthdate || !sex}
          >
            {t('common_save')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
