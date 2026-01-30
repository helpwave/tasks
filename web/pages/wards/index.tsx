import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExpandableUncontrolled, LoadingAndErrorComponent } from '@helpwave/hightide'
import { Cross, Star } from 'lucide-react'
import clsx from 'clsx'
import { useRouter } from 'next/router'

type Ward = {
  id: string,
  name: string,
  patientCount: number,
  freeBedCount: number,
  totalBedCount: number,
  isFavorite: boolean,
}

type WardGroup = {
  name: string,
  wards: Ward[],
}

const defaultData: WardGroup[] = [
  {
    name: 'Emergency',
    wards: [
      {
        id: 'ER-1',
        name: 'Trauma Unit',
        patientCount: 18,
        freeBedCount: 2,
        totalBedCount: 20,
        isFavorite: true,
      },
      {
        id: 'ER-2',
        name: 'Acute Care',
        patientCount: 22,
        freeBedCount: 3,
        totalBedCount: 25,
        isFavorite: false,
      },
      {
        id: 'ER-3',
        name: 'Observation',
        patientCount: 10,
        freeBedCount: 5,
        totalBedCount: 15,
        isFavorite: false,
      },
    ],
  },
  {
    name: 'Surgery',
    wards: [
      {
        id: 'SUR-1',
        name: 'General Surgery',
        patientCount: 16,
        freeBedCount: 4,
        totalBedCount: 20,
        isFavorite: true,
      },
      {
        id: 'SUR-2',
        name: 'Orthopedics',
        patientCount: 14,
        freeBedCount: 6,
        totalBedCount: 20,
        isFavorite: false,
      },
      {
        id: 'SUR-3',
        name: 'Neurosurgery',
        patientCount: 9,
        freeBedCount: 1,
        totalBedCount: 10,
        isFavorite: false,
      },
    ],
  },
  {
    name: 'Internal Medicine',
    wards: [
      {
        id: 'IM-1',
        name: 'Cardiology',
        patientCount: 20,
        freeBedCount: 2,
        totalBedCount: 22,
        isFavorite: true,
      },
      {
        id: 'IM-2',
        name: 'Pulmonology',
        patientCount: 15,
        freeBedCount: 5,
        totalBedCount: 20,
        isFavorite: false,
      },
    ],
  },
  {
    name: 'Pediatrics',
    wards: [
      {
        id: 'PED-1',
        name: 'Neonatal',
        patientCount: 8,
        freeBedCount: 2,
        totalBedCount: 10,
        isFavorite: false,
      },
      {
        id: 'PED-2',
        name: 'Child Care',
        patientCount: 12,
        freeBedCount: 6,
        totalBedCount: 18,
        isFavorite: true,
      },
    ],
  },
]

type WardCardProps = {
  ward: Ward,
}

const WardCard = ({ ward }: WardCardProps) => {
  const translation = useTasksTranslation()
  const { isFavorite, name, patientCount, totalBedCount, freeBedCount } = ward
  const occupancyPercentage = Math.round((1 - (freeBedCount / Math.max(totalBedCount, 1))) * 100)
  const router = useRouter()

  return (
    <div
      className="flex-col-4 p-4 border-1 border-secondary/40 hover:border-secondary bg-secondary/10 rounded-lg hover:cursor-pointer"
      onClick={() => {
        router.push(`/location/${ward.id}`).catch(() => {})
      }}
    >
      <div className="flex-col-1">
        <div className="flex-row-4 justify-between items-center">
          <div className="flex-row-1 items-center text-primary">
            <Cross className="size-4"/>
            <span className="typography-title-sm font-bold">{name}</span>
          </div>
          <button
            className={clsx(
              'hover:text-primary/50 size-4',
              {
                'text-primary': isFavorite,
                'text-disabled': !isFavorite,
              }
            )}
            onClick={(event) => {
              event.stopPropagation()
              // TODO make set favorite request here
            }}
          >
            <Star size="size-4"/>
          </button>
        </div>
        <span className="typography-label-md font-medium text-description">
          {translation('nPatient', { count: patientCount })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 w-full">
        <div className="flex-col-0">
          <span className="typography-label-lg font-bold">
            {freeBedCount}
          </span>
          {/* TODO add typography-label-sm here once it exists */}
          <span className="text-sm text-description">
            {translation('freeBeds')}
          </span>
        </div>
        <div className="flex-col-0">
          <span
            className={clsx(
              'typography-label-lg font-bold',
              {
                'text-description': occupancyPercentage <= 70,
                'text-warning': 70 < occupancyPercentage && occupancyPercentage <= 85,
                'text-negative': 85 < occupancyPercentage,
              }
            )}
          >
            {occupancyPercentage + '%'}
          </span>
          {/* TODO add typography-label-sm here once it exists */}
          <span className="text-sm text-description">
            {translation('occupancy')}
          </span>
        </div>
      </div>
    </div>
  )
}

const WardsOverviewPage: NextPage = () => {
  const translation = useTasksTranslation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ward', 'overview'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 1000))
      return defaultData
    }
  })
  const favorites = useMemo(
    () =>
      data?.reduce<Ward[]>((acc, group) => {
        group.wards.forEach(ward => {
          if (ward.isFavorite) acc.push(ward)
        })
        return acc
      }, []) ?? [],
    [data]
  )

  return (
    <Page pageTitle={titleWrapper(translation('wards'))}>
      <ContentPanel
        titleElement={translation('wards')}
      >
        <LoadingAndErrorComponent
          isLoading={isLoading}
          hasError={isError}
          className="w-full min-h-24"
        >
          <ExpandableUncontrolled
            label={(
              <div className="flex-row-1 items-center">
                <Star className="text-primary size-4"/>
                {translation('myFavorites')}
              </div>
            )}
            headerClassName="typography-label-md font-bold !px-4 !py-4 rounded-xl"
            contentExpandedClassName="!max-h-none !h-auto !overflow-visible pb-4"
            className="rounded-xl"
            isExpanded={true}
          >
            <ul className="flex flex-wrap gap-4">
              {favorites.map(ward => (
                <li key={ward.id} className="min-w-60">
                  <WardCard ward={ward}/>
                </li>
              ))}
            </ul>
          </ExpandableUncontrolled>
          {data?.map((wardGroup, index) => (
            <ExpandableUncontrolled
              key={index}
              label={wardGroup.name}
              headerClassName="typography-label-md font-bold !px-4 !py-4 rounded-xl"
              contentExpandedClassName="!max-h-none !h-auto !overflow-visible pb-4"
              className="rounded-xl"
              isExpanded={false}
            >
              <ul className="flex flex-wrap gap-4">
                {wardGroup.wards.map(ward => (
                  <li key={ward.id} className="min-w-60">
                    <WardCard ward={ward}/>
                  </li>
                ))}
              </ul>
            </ExpandableUncontrolled>
          ))}
        </LoadingAndErrorComponent>
      </ContentPanel>
    </Page>
  )
}

export default WardsOverviewPage
