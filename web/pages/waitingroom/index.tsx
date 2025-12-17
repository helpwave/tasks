import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { PatientList } from '@/components/patients/PatientList'
import { useRouter } from 'next/router'
import { PatientState } from '@/api/gql/generated'

const WaitingroomPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const patientId = router.query['patientId'] as string | undefined

  return (
    <Page pageTitle={titleWrapper(translation('waitingroom'))}>
      <ContentPanel titleElement={translation('waitingroom')}>
        <PatientList
          acceptedStates={[PatientState.Wait]}
          initialPatientId={patientId}
          onInitialPatientOpened={() => router.replace('/waitingroom', undefined, { shallow: true })}
        />
      </ContentPanel>
    </Page>
  )
}

export default WaitingroomPage

