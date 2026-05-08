import { useState, useMemo, useEffect, useCallback } from 'react'
import type { FormFieldDataHandling } from '@helpwave/hightide'
import { FormProvider, Input, DateTimeInput, Select, SelectOption, Textarea, Checkbox, Button, ConfirmDialog, LoadingContainer, useCreateForm, FormField, Visibility, useFormObserverKey, IconButton } from '@helpwave/hightide'
import { CenteredLoadingLogo } from '@/components/CenteredLoadingLogo'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput, LocationNodeType, UpdatePatientInput, GetPatientQuery } from '@/api/gql/generated'
import { Sex, PatientState } from '@/api/gql/generated'
import { useLocations, usePatient } from '@/data'
import { Building2, CheckIcon, Locate, PlusIcon, Users, XIcon } from 'lucide-react'
import { formatLocationPath, formatLocationPathFromId } from '@/utils/location'
import { toISODate } from './PatientDetailView'
import type { PatientDetailListSuccessHint } from './patientDetailListHint'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import {
  useCreatePatient,
  useAdmitPatient,
  useDischargePatient,
  useDeletePatient,
  useWaitPatient,
  useMarkPatientDead,
  useUpdatePatient,
  useRefreshingEntityIds
} from '@/data'
import { useTasksContext } from '@/hooks/useTasksContext'
import { ErrorDialog } from '@/components/ErrorDialog'
import { useCreateDraftDirty } from '@/hooks/useCreateDraftDirty'
import { serializePatientCreateDraft } from '@/utils/createDraftSnapshots'

type PatientFormValues = Omit<CreatePatientInput, 'clinicId' | 'teamIds' | 'positionId'> & {
  clinic: NonNullable<GetPatientQuery['patient']>['clinic'] | null,
  teams?: NonNullable<GetPatientQuery['patient']>['teams'] | null,
  position?: NonNullable<GetPatientQuery['patient']>['position'] | null,
}

interface PatientDataEditorProps {
  id: null | string,
  initialCreateData?: Partial<CreatePatientInput>,
  onSuccess?: (hint?: PatientDetailListSuccessHint) => void,
  onClose?: () => void,
  onCreateDraftDirtyChange?: (dirty: boolean) => void,
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

const normalizeBirthdateValue = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  if (value instanceof Date) return toISODate(value)
  const s = String(value)
  return s.length >= 10 ? s.slice(0, 10) : s
}

export const PatientDataEditor = ({
  id,
  initialCreateData = {},
  onSuccess,
  onClose,
  onCreateDraftDirtyChange,
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
  const { refreshingPatientIds } = useRefreshingEntityIds()

  const { data: patientData, loading: isLoadingPatient } = usePatient(
    patientId ?? '',
    { skip: !isEditMode }
  )

  const { data: locationsData } = useLocations()

  const locationsMap = useMemo(() => {
    if (!locationsData?.locationNodes) return new Map()
    const map = new Map<string, { id: string, title: string, parentId?: string | null }>()
    locationsData.locationNodes.forEach(loc => {
      map.set(loc.id, { id: loc.id, title: loc.title, parentId: loc.parentId || null })
    })
    return map
  }, [locationsData])

  const [createPatient, { loading: isCreating }] = useCreatePatient()
  const [admitPatient] = useAdmitPatient()
  const [dischargePatient] = useDischargePatient()
  const [deletePatient] = useDeletePatient()
  const [waitPatient] = useWaitPatient()
  const [markPatientDead] = useMarkPatientDead()
  const [updatePatient] = useUpdatePatient()


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
        birthdate: toISODate(values.birthdate)!,
        sex: values.sex,
        assignedLocationIds: values.assignedLocationIds,
        clinicId: values.clinic!.id,
        teamIds: values.teams?.filter(Boolean).map(t => t.id) || undefined,
        positionId: values.position?.id,
        state: values.state,
        description: values.description,
      }
      createPatient({
        variables: { data },
        onCompleted: () => {
          onCreateDraftDirtyChange?.(false)
          onSuccess?.({ needsPatientListRefetch: true })
          onClose?.()
        },
        onError: (error) => {
          setErrorDialog({ isOpen: true, message: error instanceof Error ? error.message : 'Failed to create patient' })
        },
      })
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
        if (!value) {
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
    },
    onValidUpdate: (_, updates) => {
      if (!isEditMode || !patientId || !patientData) return
      const data: UpdatePatientInput = {
        firstname: updates?.firstname,
        lastname: updates.lastname,
        birthdate: toISODate(updates.birthdate),
        sex: updates.sex,
        assignedLocationIds: updates.assignedLocationIds,
        clinicId: updates.clinic?.id,
        teamIds: updates.teams?.map(t => t.id),
        positionId: updates.position?.id,
        description: updates.description,
      }
      const current = patientData
      const sameFirstname = (data.firstname ?? current.firstname) === current.firstname
      const sameLastname = (data.lastname ?? current.lastname) === current.lastname
      const sameBirthdate = (data.birthdate ?? toISODate(current.birthdate)) === toISODate(current.birthdate)
      const sameSex = (data.sex ?? current.sex) === current.sex
      const sameAssignedIds = (data.assignedLocationIds ?? current.assignedLocations?.map((l: { id: string }) => l.id) ?? []).length === (current.assignedLocations?.length ?? 0) &&
        (data.assignedLocationIds ?? []).every((id: string, i: number) => id === current.assignedLocations?.[i]?.id)
      const sameClinic = (data.clinicId ?? current.clinic?.id) === current.clinic?.id
      const sameTeamIds = (data.teamIds ?? current.teams?.map((t: { id: string }) => t.id) ?? []).length === (current.teams?.length ?? 0) &&
        (data.teamIds ?? []).every((id: string, i: number) => id === current.teams?.[i]?.id)
      const samePosition = (data.positionId ?? current.position?.id) === current.position?.id
      const sameDescription = (data.description ?? current.description ?? '') === (current.description ?? '')
      if (sameFirstname && sameLastname && sameBirthdate && sameSex && sameAssignedIds && sameClinic && sameTeamIds && samePosition && sameDescription) return
      const needsPatientListRefetch = !sameClinic || !sameTeamIds || !samePosition || !sameAssignedIds
      updatePatient({
        variables: { id: patientId, data },
        onCompleted: () => onSuccess?.({ needsPatientListRefetch }),
      })
    }
  })

  const { store, update: updateForm } = form

  const serializePatientDraft = useCallback(
    (values: PatientFormValues) => serializePatientCreateDraft(values),
    []
  )

  useCreateDraftDirty({
    enabled: !isEditMode && onCreateDraftDirtyChange != null,
    store,
    serialize: serializePatientDraft,
    onDirtyChange: onCreateDraftDirtyChange,
  })

  useEffect(() => {
    if (patientData) {
      const patient = patientData
      const { firstname, lastname, sex, birthdate, assignedLocations, clinic, position, teams, description, state } = patient
      const value: PatientFormValues = {
        firstname,
        lastname,
        sex,
        birthdate: toISODate(birthdate),
        assignedLocationIds: assignedLocations.map((loc: { id: string }) => loc.id),
        clinic: clinic || null,
        position: position || null,
        teams: teams || null,
        description: description,
        state,
      }
      updateForm(prev => ({
        ...prev,
        ...value,
      }))
    }
  }, [updateForm, patientData])

  const clinic = useFormObserverKey({ formStore: form.store, formKey: 'clinic' })?.value ?? null
  const position = useFormObserverKey({ formStore: form.store, formKey: 'position' })?.value ?? null
  const teams = useFormObserverKey({ formStore: form.store, formKey: 'teams' })?.value ?? []

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
    return <CenteredLoadingLogo />
  }

  const sexOptions = [
    { label: translation('male'), value: Sex.Male },
    { label: translation('female'), value: Sex.Female },
    { label: translation('diverse'), value: Sex.Unknown }
  ]

  const isRefreshing = isEditMode && patientId != null && refreshingPatientIds.has(patientId)

  return (
    <>
      {isRefreshing && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-surface-neutral mb-4">
          <LoadingContainer className="size-5 shrink-0" />
          <span className="text-sm text-on-surface">{translation('refreshing')}</span>
        </div>
      )}
      <FormProvider state={form}>
        <form onSubmit={event => {event.preventDefault(); form.submit() }} className="flex-col-6 pb-16 overflow-y-auto px-2 pt-4">
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
                value={convertBirthdateStringToDate(dataProps.value) ?? null}
                onValueChange={(value) => {
                  const normalized = normalizeBirthdateValue(value)
                  if (normalized) dataProps.onValueChange(normalized)
                }}
                onEditComplete={(value) => {
                  const normalized = normalizeBirthdateValue(value)
                  if (normalized) dataProps.onEditComplete(normalized)
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
                  <SelectOption key={option.value} value={option.value} label={option.label} />
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
                    onValueChange={(value) => {
                      onValueChange(value ? PatientState.Wait : PatientState.Admitted)}
                    }
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
                    onClick={() => admitPatient({ variables: { id: patientId! }, onCompleted: () => onSuccess?.({ needsPatientListRefetch: true }) })}
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
                    onClick={() => waitPatient({ variables: { id: patientId! }, onCompleted: () => onSuccess?.({ needsPatientListRefetch: true }) })}
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
                  <IconButton
                    onClick={() => setIsClinicDialogOpen(true)}
                    tooltip={translation('selectClinic')}
                  >
                    <Building2 className="size-4" />
                  </IconButton>
                  {value && !isEditMode && (
                    <IconButton
                      onClick={() => {
                        onValueChange(null)
                        onEditComplete(null)
                      }}
                      tooltip={translation('clear')}
                      color="neutral"
                    >
                      <XIcon className="size-5" />
                    </IconButton>
                  )}
                </div>
              </div>
            )}
          </FormField>

          <FormField<PatientFormValues, 'position'>
            name="position"
            label={translation('position')}
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
                  <IconButton
                    onClick={() => setIsPositionDialogOpen(true)}
                    tooltip={translation('selectPosition')}
                  >
                    <Locate className="size-4" />
                  </IconButton>
                  {value && (
                    <IconButton
                      onClick={() => {
                        onValueChange(null)
                        onEditComplete(null)
                      }}
                      tooltip={translation('clear')}
                      color="neutral"
                    >
                      <XIcon className="size-5" />
                    </IconButton>
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
                  <IconButton
                    onClick={() => setIsTeamsDialogOpen(true)}
                    tooltip={translation('selectTeams')}
                  >
                    <Users className="size-4" />
                  </IconButton>
                  {value && value.length > 0 && (
                    <IconButton
                      onClick={() => {
                        onValueChange([])
                        onEditComplete([])
                      }}
                      tooltip={translation('clear')}
                      color="neutral"
                      title={translation('clear')}
                    >
                      <XIcon className="size-5" />
                    </IconButton>
                  )}
                </div>
              </div>
            )}
          </FormField>

          {isEditMode && patientId && patientData && (
            <div className="pt-6 mt-6 border-t border-divider flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:items-stretch">
              {patientData.state !== PatientState.Dead && (
                <Button
                  onClick={() => setIsMarkDeadDialogOpen(true)}
                  color="negative"
                  coloringStyle="outline"
                  className="w-full min-w-0 max-w-full whitespace-normal text-center leading-snug h-auto min-h-11 py-2.5 sm:w-auto sm:shrink"
                >
                  {translation('markPatientDead')}
                </Button>
              )}
              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                color="negative"
                coloringStyle="outline"
                className="w-full min-w-0 max-w-full whitespace-normal text-center leading-snug h-auto min-h-11 py-2.5 sm:w-auto sm:shrink"
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
              <PlusIcon className="size-4" />
              {translation('create')}
            </Button>
          </div>
        )}

        <ConfirmDialog
          isOpen={isMarkDeadDialogOpen}
          onCancel={() => setIsMarkDeadDialogOpen(false)}
          onConfirm={() => {
            if (patientId && markPatientDead) {
              markPatientDead({ variables: { id: patientId }, onCompleted: () => onSuccess?.({ needsPatientListRefetch: true }) })
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
              dischargePatient({ variables: { id: patientId }, onCompleted: () => onSuccess?.({ needsPatientListRefetch: true }) })
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
              deletePatient({
                variables: { id: patientId },
                onCompleted: () => {
                  onSuccess?.({ needsPatientListRefetch: true })
                  onClose?.()
                },
              })
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
    </>
  )
}
