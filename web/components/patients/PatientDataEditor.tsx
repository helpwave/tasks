import { useState, useMemo, useEffect } from 'react'
import type { FormFieldDataHandling } from '@helpwave/hightide'
import { FormProvider, Input, DateTimeInput, Select, SelectOption, Textarea, Checkbox, Button, ConfirmDialog, LoadingContainer, useCreateForm, FormField, Visibility, useFormObserverKey } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput, LocationNodeType, UpdatePatientInput, GetPatientQuery } from '@/api/gql/generated'
import { Sex, PatientState, useGetLocationsQuery, useGetPatientQuery } from '@/api/gql/generated'
import { Building2, CheckIcon, Locate, Users, XIcon } from 'lucide-react'
import { formatLocationPath, formatLocationPathFromId } from '@/utils/location'
import { toISODate } from './PatientDetailView'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import { useOptimisticCreatePatientMutation, useOptimisticAdmitPatientMutation, useOptimisticDischargePatientMutation, useOptimisticDeletePatientMutation, useOptimisticWaitPatientMutation, useOptimisticMarkPatientDeadMutation, useOptimisticUpdatePatientMutation } from '@/api/optimistic-updates/GetPatient'
import { useTasksContext } from '@/hooks/useTasksContext'
import { ErrorDialog } from '@/components/ErrorDialog'

type PatientFormValues = Omit<CreatePatientInput, 'clinicId' | 'teamIds' | 'positionId'> & {
  clinic: NonNullable<GetPatientQuery['patient']>['clinic'] | null,
  teams?: NonNullable<GetPatientQuery['patient']>['teams'] | null,
  position?: NonNullable<GetPatientQuery['patient']>['position'] | null,
}

interface PatientDataEditorProps {
  id: null | string,
  initialCreateData?: Partial<CreatePatientInput>,
  onSuccess?: () => void,
  onClose?: () => void,
}

const getDefaultBirthdate = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return toISODate(d)
}

const convertBirthdateStringToDate = (birthdate: string | null | undefined): Date | null => {
  if (!birthdate) return null
  return new Date(birthdate)
}

export const PatientDataEditor = ({
  id,
  initialCreateData = {},
  onSuccess,
  onClose,
}: PatientDataEditorProps) => {
  const translation = useTasksTranslation()
  const { selectedLocationId, selectedRootLocationIds, rootLocations } = useTasksContext()
  const firstSelectedRootLocationId = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds[0] : undefined

  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean, message?: string }>({ isOpen: false })
  const [isClinicDialogOpen, setIsClinicDialogOpen] = useState(false)
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false)
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false)
  const [isMarkDeadDialogOpen, setIsMarkDeadDialogOpen] = useState(false)
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isEditMode = id !== null
  const patientId = id

  const { data: patientData, isLoading: isLoadingPatient } = useGetPatientQuery(
    { id: patientId! },
    { enabled: isEditMode }
  )

  const { data: locationsData } = useGetLocationsQuery(undefined)

  const locationsMap = useMemo(() => {
    if (!locationsData?.locationNodes) return new Map()
    const map = new Map<string, { id: string, title: string, parentId?: string | null }>()
    locationsData.locationNodes.forEach(loc => {
      map.set(loc.id, { id: loc.id, title: loc.title, parentId: loc.parentId || null })
    })
    return map
  }, [locationsData])

  const [isCreating, setIsCreating] = useState<boolean>(false)
  const { mutate: createPatient } = useOptimisticCreatePatientMutation({
    onMutate: () => {
      setIsCreating(true)
    },
    onSettled: () => {
      setIsCreating(false)
    },
    onSuccess: async () => {
      onSuccess?.()
      onClose?.()
    },
    onError: (error) => {
      setErrorDialog({ isOpen: true, message: error instanceof Error ? error.message : 'Failed to create patient' })
    },
  })

  const { mutate: admitPatient } = useOptimisticAdmitPatientMutation({
    id: patientId!,
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const { mutate: dischargePatient } = useOptimisticDischargePatientMutation({
    id: patientId!,
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const { mutate: deletePatient } = useOptimisticDeletePatientMutation({
    onSuccess: async () => {
      onSuccess?.()
      onClose?.()
    },
  })


  const { mutate: waitPatient } = useOptimisticWaitPatientMutation({
    id: patientId!,
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const { mutate: markPatientDead } = useOptimisticMarkPatientDeadMutation({
    id: patientId!,
    onSuccess: () => {
      onSuccess?.()
    },
  })

  const { mutate: updatePatient } = useOptimisticUpdatePatientMutation({
    id: patientId!,
    onSuccess: () => {
      onSuccess?.()
    },
  })


  const form = useCreateForm<PatientFormValues>({
    initialValues: {
      firstname: '',
      lastname: '',
      sex: Sex.Female,
      assignedLocationIds: selectedLocationId ? [selectedLocationId] : [],
      birthdate: getDefaultBirthdate(),
      state: PatientState.Wait,
      description: null,
      clinic: null,
      teams: null,
      position: null,
      ...initialCreateData,
    },
    onFormSubmit: (values) => {
      const data: CreatePatientInput = {
        firstname: values.firstname,
        lastname: values.lastname,
        birthdate: values.birthdate,
        sex: values.sex,
        assignedLocationIds: values.assignedLocationIds,
        clinicId: values.clinic!.id,
        teamIds: values.teams?.filter(Boolean).map(t => t.id) || undefined,
        positionId: values.position!.id,
        state: values.state,
        description: values.description,
      }
      createPatient({ data })
    },
    validators: {
      firstname: (value) => {
        if (!value || !value.trim()) {
          return translation('firstName') + ' is required'
        }
        return null
      },
      lastname: (value) => {
        if (!value || !value.trim()) {
          return translation('lastName') + ' is required'
        }
        return null
      },
      birthdate: (value) => {
        if (!value || !value.trim()) {
          return translation('birthdate') + ' is required'
        }
        return null
      },

      sex: (value) => {
        if (!value) {
          return translation('sex') + ' is required'
        }
        return null
      },
      clinic: (value) => {
        if (!value) {
          return translation('clinic') + ' is required'
        }
        return null
      },
      position: (value) => {
        if (!value) {
          return translation('position') + ' is required'
        }
        return null
      },
    },
    onValidUpdate: (_, updates) => {
      if (isEditMode && patientId) {
        const data: UpdatePatientInput = {
          firstname: updates?.firstname,
          lastname: updates.lastname,
          birthdate: updates.birthdate,
          sex: updates.sex,
          assignedLocationIds: updates.assignedLocationIds,
          clinicId: updates.clinic?.id,
          teamIds: updates.teams?.map(t => t.id),
          positionId: updates.position?.id,
          description: updates.description,
        }
        updatePatient({ id: patientId, data })
      }
    }
  })

  const { store, update: updateForm } = form

  useEffect(() => {
    if (patientData?.patient) {
      const patient = patientData.patient
      const { firstname, lastname, sex, birthdate, assignedLocations, clinic, position, teams, description } = patient
      const value: PatientFormValues = {
        firstname,
        lastname,
        sex,
        birthdate: toISODate(birthdate),
        assignedLocationIds: assignedLocations.map(loc => loc.id),
        clinic: clinic || null,
        position: position || null,
        teams: teams || null,
        description: description,
      }
      updateForm(prev => ({
        ...prev,
        ...value,
      }))
    }
  }, [updateForm, patientData])

  const startDate = useMemo(() => {
    const year = new Date()
    year.setFullYear(year.getFullYear() - 100)
    return year
  }, [])

  const endDate = useMemo(() => {
    return new Date()
  }, [])

  const clinic = useFormObserverKey({ formStore: form.store, key: 'clinic' })?.value ?? null
  const position = useFormObserverKey({ formStore: form.store, key: 'position' })?.value ?? null
  const teams = useFormObserverKey({ formStore: form.store, key: 'teams' })?.value ?? []

  useEffect(() => {
    if (!isEditMode && locationsData?.locationNodes && !clinic) {
      let clinicLocation: LocationNodeType | undefined
      if (firstSelectedRootLocationId) {
        const selectedRootLocation = locationsData.locationNodes.find(
          loc => loc.id === firstSelectedRootLocationId && loc.kind === 'CLINIC'
        )
        if (selectedRootLocation) {
          clinicLocation = selectedRootLocation as LocationNodeType
        }
      }
      if (!clinicLocation && rootLocations && rootLocations.length > 0) {
        const firstClinic = rootLocations.find(loc => loc.kind === 'CLINIC')
        if (firstClinic) {
          clinicLocation = firstClinic as LocationNodeType
        }
      }
      if (clinicLocation) {
        updateForm({ clinic: clinicLocation })
      }
    }
  }, [isEditMode, firstSelectedRootLocationId, locationsData, rootLocations, clinic, updateForm])

  if (isEditMode && isLoadingPatient) {
    return <LoadingContainer />
  }

  const sexOptions = [
    { label: translation('male'), value: Sex.Male },
    { label: translation('female'), value: Sex.Female },
    { label: translation('diverse'), value: Sex.Unknown }
  ]


  return (
    <FormProvider state={form}>
      <form onSubmit={event => {event.preventDefault(); form.submit() }} className="flex-col-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField<PatientFormValues, 'firstname'>
            name="firstname"
            label={translation('firstName')}
            required
            showRequiredIndicator={!isEditMode}
          >
            {({ dataProps, focusableElementProps, interactionStates  }) => (
              <Input
                {...dataProps} {...focusableElementProps} {...interactionStates}
                placeholder={translation('firstName')}
              />
            )}
          </FormField>
          <FormField<PatientFormValues, 'lastname'>
            name="lastname"
            label={translation('lastName')}
            required
            showRequiredIndicator={!isEditMode}
          >
            {({ dataProps, focusableElementProps, interactionStates  }) => (
              <Input
                {...dataProps} {...focusableElementProps} {...interactionStates}
                placeholder={translation('lastName')}
              />
            )}
          </FormField>
        </div>

        <FormField<PatientFormValues, 'birthdate'>
          name="birthdate"
          label={translation('birthdate')}
          required
          showRequiredIndicator={!isEditMode}
        >
          {({ dataProps, focusableElementProps, interactionStates  }) => (
            <DateTimeInput
              {...focusableElementProps} {...interactionStates}
              value={convertBirthdateStringToDate(dataProps.value) ?? undefined}
              onValueChange={(value) => dataProps.onValueChange(value ? toISODate(value) : undefined)}
              onEditComplete={(value) => dataProps.onEditComplete(value ? toISODate(value) : undefined)}
              pickerProps={{
                start: startDate,
                end: endDate
              }}
              mode="date"
            />
          )}
        </FormField>

        <FormField<PatientFormValues, 'sex'>
          name="sex"
          label={translation('sex')}
          required
          showRequiredIndicator={!isEditMode}
        >
          {({ dataProps, focusableElementProps, interactionStates  }) => (
            <Select
              {...dataProps as FormFieldDataHandling<string>}
              {...focusableElementProps}
              {...interactionStates}
            >
              {sexOptions.map(option => (
                <SelectOption key={option.value} value={option.value}>
                  {option.label}
                </SelectOption>
              ))}
            </Select>
          )}
        </FormField>
        <FormField<PatientFormValues, 'description'>
          name="description"
          label={translation('description')}
          showRequiredIndicator={!isEditMode}
        >
          {({ dataProps, focusableElementProps, interactionStates  }) => (
            <Textarea
              {...dataProps} {...focusableElementProps} {...interactionStates}
              value={dataProps.value || ''}
              placeholder={translation('description')}
            />
          )}
        </FormField>

        {!isEditMode && (
          <FormField<PatientFormValues, 'state'>
            name="state"
            label={translation('status')}
            showRequiredIndicator={!isEditMode}
          >
            {({ dataProps: { value, onValueChange, onEditComplete }, focusableElementProps, interactionStates  }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  {...focusableElementProps} {...interactionStates}
                  value={value === PatientState.Wait}
                  onValueChange={(value) => onValueChange(value ? PatientState.Wait : PatientState.Admitted)}
                  onEditComplete={(value) => onEditComplete(value ? PatientState.Wait : PatientState.Admitted)}
                />
                <span>{translation('waitingForPatient')}</span>
              </div>
            )}
          </FormField>
        )}

        {isEditMode  &&(
          <FormField<PatientFormValues, 'state'>
            name="state"
            label={translation('patientActions')}
            showRequiredIndicator={!isEditMode}
          >
            {({ dataProps: { value }  }) => (
              <div className="flex gap-4 flex-wrap">
                <Button
                  disabled={value === PatientState.Admitted}
                  onClick={() => admitPatient({ id: patientId! })}
                  color={value === PatientState.Admitted ? 'positive' : 'neutral'}
                >
                  <Visibility isVisible={value === PatientState.Admitted}>
                    <CheckIcon className="size-4" aria-hidden="true" />
                  </Visibility>
                  {translation('admitPatient')}
                </Button>
                <Button
                  disabled={value === PatientState.Discharged}
                  onClick={() => setIsDischargeDialogOpen(true)}
                  color="neutral"
                >
                  <Visibility isVisible={value === PatientState.Admitted}>
                    <CheckIcon className="size-4" aria-hidden="true" />
                  </Visibility>
                  {translation('dischargePatient')}
                </Button>
                <Button
                  disabled={value === PatientState.Wait}
                  onClick={() => waitPatient({ id: patientId! })}
                  color={value === PatientState.Wait ? 'warning' : 'neutral'}
                >
                  <Visibility isVisible={value === PatientState.Admitted}>
                    <CheckIcon className="size-4" aria-hidden="true" />
                  </Visibility>
                  {translation('waitPatient')}
                </Button>
              </div>
            )}
          </FormField>
        )}

        <FormField<PatientFormValues, 'clinic'>
          name="clinic"
          label={translation('clinic')}
          required
          showRequiredIndicator={!isEditMode}
        >
          {({ dataProps: { value, onValueChange, onEditComplete }, focusableElementProps, interactionStates  }) => (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  {...focusableElementProps} {...interactionStates}
                  value={value ? (locationsMap.size > 0 ? formatLocationPathFromId(value.id, locationsMap) : formatLocationPath(value)) : ''}
                  placeholder={translation('selectClinic')}
                  readOnly
                  className="flex-grow cursor-pointer"
                  onClick={() => setIsClinicDialogOpen(true)}
                />
                <Button
                  onClick={() => setIsClinicDialogOpen(true)}
                  layout="icon"
                  title={translation('selectClinic')}
                >
                  <Building2 className="size-4" />
                </Button>
                {value && !isEditMode && (
                  <Button
                    onClick={() => {
                      onValueChange(null)
                      onEditComplete(null)
                    }}
                    layout="icon"
                    color="neutral"
                    title={translation('clear')}
                  >
                    <XIcon className="size-5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </FormField>

        <FormField<PatientFormValues, 'position'>
          name="position"
          label={translation('position')}
          required
          showRequiredIndicator={!isEditMode}
        >
          {({ dataProps: { value, onValueChange, onEditComplete }, focusableElementProps, interactionStates  }) => (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  {...focusableElementProps} {...interactionStates}
                  value={value ? (locationsMap.size > 0 ? formatLocationPathFromId(value.id, locationsMap) : formatLocationPath(value)) : ''}
                  placeholder={translation('selectPosition')}
                  readOnly
                  className="flex-grow cursor-pointer"
                  onClick={() => setIsPositionDialogOpen(true)}
                />
                <Button
                  onClick={() => setIsPositionDialogOpen(true)}
                  layout="icon"
                  title={translation('selectPosition')}
                >
                  <Locate className="size-4" />
                </Button>
                {value && (
                  <Button
                    onClick={() => {
                      onValueChange(null)
                      onEditComplete(null)
                    }}
                    layout="icon"
                    color="neutral"
                    title={translation('clear')}
                  >
                    <XIcon className="size-5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </FormField>

        <FormField<PatientFormValues, 'teams'>
          name="teams"
          label={translation('teams')}
        >
          {({ dataProps: { value, onValueChange, onEditComplete }, focusableElementProps, interactionStates  }) => (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  {...focusableElementProps} {...interactionStates}
                  value={value && value.length > 0
                    ? value.map(loc => locationsMap.size > 0 ? formatLocationPathFromId(loc.id, locationsMap) : formatLocationPath(loc)).join(', ')
                    : ''}
                  placeholder={translation('selectTeams')}
                  readOnly
                  className="flex-grow cursor-pointer"
                  onClick={() => setIsTeamsDialogOpen(true)}
                />
                <Button
                  onClick={() => setIsTeamsDialogOpen(true)}
                  layout="icon"
                  title={translation('selectTeams')}
                >
                  <Users className="size-4" />
                </Button>
                {value && value.length > 0 && (
                  <Button
                    onClick={() => {
                      onValueChange([])
                      onEditComplete([])
                    }}
                    layout="icon"
                    color="neutral"
                    title={translation('clear')}
                  >
                    <XIcon className="size-5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </FormField>

        {isEditMode && patientId && patientData?.patient && (
          <div className="pt-6 mt-6 border-t border-divider flex justify-end gap-2">
            {patientData.patient.state !== PatientState.Dead && (
              <Button
                onClick={() => setIsMarkDeadDialogOpen(true)}
                color="negative"
                coloringStyle="outline"
              >
                {translation('markPatientDead')}
              </Button>
            )}
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              color="negative"
              coloringStyle="outline"
            >
              {translation('deletePatient') ?? 'Delete Patient'}
            </Button>
          </div>
        )}
      </form>

      {!isEditMode && (
        <div className="flex-none pt-4 mt-auto border-t border-divider flex justify-end gap-2">
          <Button
            onClick={form.submit}
            disabled={isCreating}
          >
            {translation('create')}
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={isMarkDeadDialogOpen}
        onCancel={() => setIsMarkDeadDialogOpen(false)}
        onConfirm={() => {
          if (patientId && markPatientDead) {
            markPatientDead({ id: patientId })
          }
          setIsMarkDeadDialogOpen(false)
        }}
        titleElement={translation('markPatientDead')}
        description={translation('markPatientDeadConfirmation')}
        confirmType="negative"
      />

      <ConfirmDialog
        isOpen={isDischargeDialogOpen}
        onCancel={() => setIsDischargeDialogOpen(false)}
        onConfirm={() => {
          if (patientId && dischargePatient) {
            dischargePatient({ id: patientId })
          }
          setIsDischargeDialogOpen(false)
        }}
        titleElement={translation('dischargePatient')}
        description={translation('dischargePatientConfirmation')}
        confirmType="neutral"
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (patientId && deletePatient) {
            deletePatient({ id: patientId })
          }
          setIsDeleteDialogOpen(false)
        }}
        titleElement={translation('deletePatient') ?? 'Delete Patient'}
        description={translation('deletePatientConfirmation') ?? 'Are you sure you want to delete this patient? This action cannot be undone.'}
        confirmType="negative"
      />

      <LocationSelectionDialog
        isOpen={isClinicDialogOpen}
        onClose={() => setIsClinicDialogOpen(false)}
        onSelect={(locations) => {
          store.setTouched('clinic')
          store.setValue('clinic', locations[0] ?? null, true)
        }}
        initialSelectedIds={clinic ? [clinic.id] : []}
        multiSelect={false}
        useCase="clinic"
      />
      <LocationSelectionDialog
        isOpen={isPositionDialogOpen}
        onClose={() => setIsPositionDialogOpen(false)}
        onSelect={(locations) => {
          store.setTouched('position')
          store.setValue('position', locations[0] ?? null, true)
        }}
        initialSelectedIds={position ? [position.id] : []}
        multiSelect={false}
        useCase="position"
      />
      <LocationSelectionDialog
        isOpen={isTeamsDialogOpen}
        onClose={() => setIsTeamsDialogOpen(false)}
        onSelect={(locations) => {
          store.setTouched('teams')
          store.setValue('teams', locations ?? [], true)
        }}
        initialSelectedIds={teams?.map(loc => loc.id)}
        multiSelect={true}
        useCase="teams"
      />
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ isOpen: false })}
        message={errorDialog.message}
      />
    </FormProvider>
  )
}
