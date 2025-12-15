import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button, Chip, FillerRowElement, LoadingContainer, Table } from '@helpwave/hightide'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/table-core'
import { EditIcon, PlusIcon } from 'lucide-react'
import { SidePanel } from '@/components/layout/SidePanel'
import type { Property } from '@/components/PropertyList'
import { exampleProperties } from '@/components/PropertyList'
import { useQuery } from '@tanstack/react-query'
import { PropertyDetailView } from '@/components/properties/PropertyDetailView'

const PropertiesPage: NextPage = () => {
  const translation = useTasksTranslation()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selected, setSelected] = useState<Property>()

  const { data, refetch } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      return exampleProperties
    }
  })

  const handleEdit = (value: Property) => {
    setSelected(value)
    setIsPanelOpen(true)
  }

  const handleAdd = () => {
    setSelected(undefined)
    setIsPanelOpen(true)
  }

  const handleClose = () => {
    setIsPanelOpen(false)
    setSelected(undefined)
  }

  const columns = useMemo<ColumnDef<Property>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      minSize: 200,
      size: 250,
      maxSize: 300,
    },
    {
      id: 'fieldType',
      header: translation('type'),
      accessorKey: 'fieldType',
      cell: ({ row }) => {
        const value = row.original.fieldType

        return (
          <Chip size="small">
            <span className="capitalize">{value}</span>
          </Chip>
        )
      },
      minSize: 100,
      size: 100,
      maxSize: 150,
    },
    {
      id: 'subjectType',
      header: translation('subjectType'),
      accessorKey: 'subjectType',
      cell: ({ row }) => {
        const data = row.original
        return (
          <span className="typography-label-sm font-bold">
            {data.subjectType}
          </span>
        )
      },
      minSize: 150,
      size: 150,
      maxSize: 250,
    },
    {
      id: 'active',
      header: translation('status'),
      accessorKey: 'isArchived',
      cell: ({ row }) => {
        return (
          <Chip color={row.original.isArchived ? 'negative' : 'positive'}>
            {translation(row.original.isArchived ? 'inactive' : 'active')}
          </Chip>
        )
      },
      minSize: 100,
      size: 120,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          layout="icon"
          coloringStyle="text"
          color="neutral"
          onClick={() => handleEdit(row.original)}
        >
          <EditIcon/>
        </Button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 77,
      minSize: 77,
      maxSize: 77
    }
  ], [translation])

  return (
    <Page pageTitle={titleWrapper(translation('properties'))}>
      <ContentPanel
        titleElement={translation('properties')}
        description={data ?  translation('nPatient', { count: data.length }) : (<LoadingContainer/>) }
        actionElement={(
          <Button startIcon={<PlusIcon/>} onClick={handleAdd}>
            {translation('rAdd', { name: translation('property') })}
          </Button>
        )}
      >
        <Table
          className="w-full h-full"
          data={data ?? []}
          columns={columns}
          fillerRow={() => (<FillerRowElement className="min-h-12"/>)}
        />
      </ContentPanel>
      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClose}
        title={translation(!selected ? 'rAdd': 'rEdit', { name: translation('property') })}
      >
        <PropertyDetailView
          id={selected?.id}
          initialData={selected}
          onClose={handleClose}
          onSuccess={refetch}
        />
      </SidePanel>
    </Page>
  )
}

export default PropertiesPage
