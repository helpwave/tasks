'use client'

import { useState } from 'react'
import { Button, Checkbox, Select, SelectOption } from '@helpwave/hightide'
import { MapPin } from 'lucide-react'
import clsx from 'clsx'
import { ScopeVisibility } from '@/api/gql/generated'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'
import { ScopeLocationChip, type ScopeLocation } from '@/components/locations/ScopeChip'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export type ScopeValue = {
  visibility: ScopeVisibility,
  location: ScopeLocation | null,
}

export const privateScope = (): ScopeValue => ({
  visibility: ScopeVisibility.Private,
  location: null,
})

export const scopeFromEntity = (entity: {
  visibility: ScopeVisibility,
  location?: ScopeLocation | null,
}): ScopeValue => ({
  visibility: entity.visibility,
  location: entity.visibility === ScopeVisibility.Private ? null : entity.location ?? null,
})

export const isScopeComplete = (value: ScopeValue): boolean =>
  value.visibility === ScopeVisibility.Private || value.location != null

export const scopeToInput = (value: ScopeValue): { visibility: ScopeVisibility, locationId: string | null } => ({
  visibility: value.visibility,
  locationId: value.visibility === ScopeVisibility.Private ? null : value.location?.id ?? null,
})

export const scopeEquals = (a: ScopeValue, b: ScopeValue): boolean =>
  a.visibility === b.visibility && (a.location?.id ?? null) === (b.location?.id ?? null)

type ScopeVisibilityFieldProps = {
  value: ScopeValue,
  onChange: (value: ScopeValue) => void,
  disabled?: boolean,
  allowShared?: boolean,
  className?: string,
}

const visibilityDescriptionKey = {
  [ScopeVisibility.Private]: 'scopePrivateDescription',
  [ScopeVisibility.Shared]: 'scopeSharedDescription',
  [ScopeVisibility.Public]: 'scopePublicDescription',
} as const

export function ScopeVisibilityField({
  value,
  onChange,
  disabled = false,
  allowShared = false,
  className,
}: ScopeVisibilityFieldProps) {
  const translation = useTasksTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const isPublic = value.visibility === ScopeVisibility.Public
  const needsLocation = value.visibility !== ScopeVisibility.Private

  const setVisibility = (visibility: ScopeVisibility) => {
    if (disabled) return
    onChange({
      visibility,
      location: visibility === ScopeVisibility.Private ? null : value.location,
    })
  }

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      <span className="typography-label-lg">{translation('scopeVisibility')}</span>
      {allowShared ? (
        <div className="flex flex-col gap-1">
          <Select<ScopeVisibility>
            value={value.visibility}
            disabled={disabled}
            onValueChange={setVisibility}
          >
            <SelectOption value={ScopeVisibility.Private} label={translation('scopePrivate')} />
            <SelectOption value={ScopeVisibility.Shared} label={translation('scopeShared')} />
            <SelectOption value={ScopeVisibility.Public} label={translation('scopePublic')} />
          </Select>
          <span className="text-description text-sm">
            {translation(visibilityDescriptionKey[value.visibility])}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Checkbox
            value={isPublic}
            disabled={disabled}
            onValueChange={(checked) => setVisibility(checked ? ScopeVisibility.Public : ScopeVisibility.Private)}
            className="mt-0.5 shrink-0"
          />
          <div
            className={clsx('flex flex-col min-w-0 select-none', disabled ? 'cursor-default' : 'cursor-pointer')}
            onClick={() => setVisibility(isPublic ? ScopeVisibility.Private : ScopeVisibility.Public)}
          >
            <span className="font-medium">{translation('scopePublic')}</span>
            <span className="text-description text-sm">
              {isPublic ? translation('scopePublicDescription') : translation('scopePrivateDescription')}
            </span>
          </div>
        </div>
      )}
      {needsLocation && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-divider bg-surface-subdued p-3">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-description">{translation('scopeStoredAt')}</span>
            {value.location ? (
              <ScopeLocationChip location={value.location} />
            ) : (
              <span className="text-description text-sm">{translation('scopeNoNodeSelected')}</span>
            )}
          </div>
          <Button
            color="neutral"
            coloringStyle="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setDialogOpen(true)}
          >
            <MapPin className="size-4" />
            {value.location ? translation('scopeChangeNode') : translation('scopeSelectNode')}
          </Button>
        </div>
      )}
      <LocationSelectionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={(locations) => {
          const node = locations[0]
          if (!node) return
          onChange({ visibility: value.visibility, location: node })
        }}
        initialSelectedIds={value.location ? [value.location.id] : []}
        multiSelect={false}
        useCase="default"
      />
    </div>
  )
}
