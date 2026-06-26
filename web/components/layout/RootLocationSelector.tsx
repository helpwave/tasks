'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@helpwave/hightide'
import { useStorage } from '@/hooks/useStorage'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useLocations } from '@/data'
import { LocationSelectionDialog } from '@/components/locations/LocationSelectionDialog'

type RootLocationSelectorProps = {
  className?: string,
  onSelect?: () => void,
  ownsDialog?: boolean,
}

export const RootLocationSelector = ({ className, onSelect, ownsDialog = false }: RootLocationSelectorProps) => {
  const { rootLocations, selectedRootLocationIds, update, isRootLocationPickerOpen, setRootLocationPickerOpen } = useTasksContext()
  const translation = useTasksTranslation()
  const [selectedLocationsCache, setSelectedLocationsCache] = useState<Array<{ id: string, title: string, kind?: string }>>([])
  const {
    value: storedSelectedRootLocationsRaw,
    setValue: setStoredSelectedRootLocations
  } = useStorage<Array<{ id: string, title: string, kind?: string }>>({
    key: 'selected-root-location-nodes',
    defaultValue: []
  })

  const storedSelectedRootLocations = useMemo(() =>
    Array.isArray(storedSelectedRootLocationsRaw)
      ? storedSelectedRootLocationsRaw.filter(
        (loc): loc is { id: string, title: string, kind?: string } =>
          Boolean(loc && typeof loc.id === 'string' && typeof loc.title === 'string')
      )
      : [],
  [storedSelectedRootLocationsRaw])

  const { data: locationsData } = useLocations(
    { limit: 1000 },
    {
      skip: !selectedRootLocationIds || selectedRootLocationIds.length === 0,
    }
  )

  useEffect(() => {
    if (selectedRootLocationIds && selectedRootLocationIds.length > 0) {
      const foundInRoot = rootLocations?.filter(loc => selectedRootLocationIds.includes(loc.id)) || []

      if (foundInRoot.length === selectedRootLocationIds.length) {
        setSelectedLocationsCache(foundInRoot.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })))
      } else if (locationsData?.locationNodes) {
        const allLocations = locationsData.locationNodes
        const foundLocations: Array<{ id: string, title: string, kind?: string }> = []
        for (const id of selectedRootLocationIds) {
          const inRoot = rootLocations?.find(loc => loc.id === id)
          if (inRoot) {
            foundLocations.push({ id: inRoot.id, title: inRoot.title, kind: inRoot.kind })
          } else {
            const inAll = allLocations.find(loc => loc.id === id)
            if (inAll) {
              foundLocations.push({ id: inAll.id, title: inAll.title, kind: inAll.kind })
            }
          }
        }

        if (foundLocations.length > 0) {
          setSelectedLocationsCache(foundLocations)
        }
      } else if (foundInRoot.length > 0) {
        setSelectedLocationsCache(foundInRoot.map(loc => ({ id: loc.id, title: loc.title, kind: loc.kind })))
      }
    } else {
      setSelectedLocationsCache([])
    }
  }, [rootLocations, selectedRootLocationIds, locationsData])

  const resolvedFromRoot = rootLocations?.filter(loc => selectedRootLocationIds?.includes(loc.id)) || []
  const resolvedFromLocationsData = useMemo(() => {
    if (
      !selectedRootLocationIds?.length ||
      resolvedFromRoot.length === selectedRootLocationIds.length ||
      !locationsData?.locationNodes
    ) {
      return []
    }
    const allLocations = locationsData.locationNodes as Array<{ id: string, title: string, kind?: string }>
    const out: Array<{ id: string, title: string, kind?: string }> = []
    for (const id of selectedRootLocationIds) {
      const inRoot = rootLocations?.find(loc => loc.id === id)
      if (inRoot) {
        out.push({ id: inRoot.id, title: inRoot.title, kind: inRoot.kind })
      } else {
        const inAll = allLocations.find(loc => loc.id === id)
        if (inAll) {
          out.push({ id: inAll.id, title: inAll.title, kind: inAll.kind })
        }
      }
    }
    return out
  }, [selectedRootLocationIds, rootLocations, locationsData?.locationNodes, resolvedFromRoot.length])

  const storedResolved = useMemo(
    () =>
      selectedRootLocationIds?.length
        ? storedSelectedRootLocations.filter(loc => selectedRootLocationIds.includes(loc.id))
        : [],
    [selectedRootLocationIds, storedSelectedRootLocations]
  )

  const selectedRootLocations =
    selectedLocationsCache.length > 0
      ? selectedLocationsCache
      : resolvedFromRoot.length > 0
        ? resolvedFromRoot
        : resolvedFromLocationsData.length > 0
          ? resolvedFromLocationsData
          : storedResolved
  const firstSelectedRootLocation = selectedRootLocations[0]
  const hasNoLocationSelected = !selectedRootLocationIds || selectedRootLocationIds.length === 0
  const hasSelectionButNoNames =
    !hasNoLocationSelected && selectedRootLocations.length === 0

  useEffect(() => {
    if (selectedRootLocations.length === 0) return
    const storedIds = storedResolved.map(loc => loc.id).join(',')
    const nextIds = selectedRootLocations.map(loc => loc.id).join(',')
    if (storedIds !== nextIds) {
      setStoredSelectedRootLocations(selectedRootLocations)
    }
  }, [selectedRootLocations, storedResolved, setStoredSelectedRootLocations])

  const handleRootLocationSelect = (locations: Array<{ id: string, title: string, kind?: string }>) => {
    if (locations.length === 0) return
    const locationIds = locations.map(loc => loc.id)
    setSelectedLocationsCache(locations)
    setStoredSelectedRootLocations(locations)
    update(prevState => {
      return {
        ...prevState,
        selectedRootLocationIds: locationIds,
      }
    })
    setRootLocationPickerOpen(false)
    onSelect?.()
  }

  const canShowSelector =
    (rootLocations && rootLocations.length > 0) ||
    (selectedRootLocationIds && selectedRootLocationIds.length > 0)
  if (!canShowSelector) {
    return null
  }

  return (
    <div className={clsx('flex-row-1 items-center gap-x-1', className)}>
      <Button
        onClick={() => setRootLocationPickerOpen(true)}
        color={hasNoLocationSelected ? 'negative' : 'neutral'}
        coloringStyle="outline"
        className="min-w-40 w-full"
      >
        {selectedRootLocations.length > 0
          ? selectedRootLocations.length === 1
            ? firstSelectedRootLocation?.title
            : selectedRootLocations.length === 2
              ? `${selectedRootLocations[0]?.title ?? ''}, ${selectedRootLocations[1]?.title ?? ''}`
              : `${selectedRootLocations[0]?.title ?? ''} +${selectedRootLocations.length - 1}`
          : hasSelectionButNoNames
            ? (translation('loading') ?? 'Loading...')
            : (translation('selectLocation') || 'Select Location')}
      </Button>
      {ownsDialog && (
        <LocationSelectionDialog
          isOpen={isRootLocationPickerOpen}
          onClose={() => setRootLocationPickerOpen(false)}
          onSelect={handleRootLocationSelect}
          initialSelectedIds={selectedRootLocationIds || []}
          multiSelect={true}
          useCase="root"
        />
      )}
    </div>
  )
}
