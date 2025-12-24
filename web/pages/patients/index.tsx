import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useTasksContext } from '@/hooks/useTasksContext'
import { PatientList } from '@/components/patients/PatientList'
import { useRouter } from 'next/router'

const PatientsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { selectedRootLocationIds } = useTasksContext()
  const patientId = router.query['patientId'] as string | undefined
  const firstSelectedRootLocationId = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds[0] : undefined

  return (
    <Page pageTitle={titleWrapper(translation('patients'))}>
      <ContentPanel titleElement={translation('patients')}>
        <PatientList
          locationId={firstSelectedRootLocationId}
          initialPatientId={patientId}
          onInitialPatientOpened={() => router.replace('/patients', undefined, { shallow: true })}
        />
      </ContentPanel>
    </Page>
  )
}

export default PatientsPage
