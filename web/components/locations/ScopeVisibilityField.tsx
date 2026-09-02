'use client'

import { useState } from 'react'
import { Button, Checkbox } from '@helpwave/hightide'
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
  location: entity.visibility === ScopeVisibility.Public ? entity.location ?? null : null,
})

export const isScopeComplete = (value: ScopeValue): boolean =>
  value.visibility === ScopeVisibility.Private || value.location != null

export const scopeToInput = (value: ScopeValue): { visibility: ScopeVisibility, locationId: string | null } => ({
  visibility: value.visibility,
  locationId: value.visibility === ScopeVisibility.Public ? value.location?.id ?? null : null,
})

export const scopeEquals = (a: ScopeValue, b: ScopeValue): boolean =>
  a.visibility === b.visibility && (a.location?.id ?? null) === (b.location?.id ?? null)

type ScopeVisibilityFieldProps = {
  value: ScopeValue,
  onChange: (value: ScopeValue) => void,
  disabled?: boolean,
  className?: string,
}

export function ScopeVisibilityField({
  value,
  onChange,
  disabled = false,
  className,
}: ScopeVisibilityFieldProps) {
  const translation = useTasksTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const isPublic = value.visibility === ScopeVisibility.Public

  const setPublic = (checked: boolean) => {
    if (disabled) return
    onChange({
      visibility: checked ? ScopeVisibility.Public : ScopeVisibility.Private,
      location: checked ? value.location : null,
    })
  }

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      <span className="typography-label-lg">{translation('scopeVisibility')}</span>
      <div className="flex items-start gap-3">
        <Checkbox
          value={isPublic}
          disabled={disabled}
          onValueChange={setPublic}
          className="mt-0.5 shrink-0"
        />
        <div
          className={clsx('flex flex-col min-w-0 select-none', disabled ? 'cursor-default' : 'cursor-pointer')}
          onClick={() => setPublic(!isPublic)}
        >
          <span className="font-medium">{translation('scopePublic')}</span>
          <span className="text-description text-sm">
            {isPublic ? translation('scopePublicDescription') : translation('scopePrivateDescription')}
          </span>
        </div>
      </div>
      {isPublic && (
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
          onChange({ visibility: ScopeVisibility.Public, location: node })
        }}
        initialSelectedIds={value.location ? [value.location.id] : []}
        multiSelect={false}
        useCase="default"
      />
    </div>
  )
}
