import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import { useTasksContext } from '@/hooks/useTasksContext'
import { PatientList, type PatientListRef } from '@/components/patients/PatientList'
import { useRef } from 'react'

const PatientsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const { selectedLocationId } = useTasksContext()
  const listRef = useRef<PatientListRef>(null)

  return (
    <Page pageTitle={titleWrapper(translation('patients'))}>
      <ContentPanel
        titleElement={translation('patients')}
        actionElement={(
          <Button startIcon={<PlusIcon />} onClick={() => listRef.current?.openCreate()}>
            {translation('addPatient')}
          </Button>
        )}
      >
        <PatientList
          ref={listRef}
          locationId={selectedLocationId}
        />
      </ContentPanel>
    </Page>
  )
}

export default PatientsPage
