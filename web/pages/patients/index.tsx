import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { useTasksContext } from '@/hooks/useTasksContext'
import { PatientList } from '@/components/tables/PatientList'
import { PatientScopeCountChips } from '@/components/patients/PatientScopeCountChips'
import { useRouter } from 'next/router'

const PatientsPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const {
    scopedPatientsTotal,
    scopedPatientsAdmitted,
    scopedPatientsWaiting,
  } = useTasksContext()
  const patientId = router.isReady ? (router.query['patientId'] as string | undefined) : undefined

  return (
    <>
      <style>{`
        [data-name="app-page-main-spacer"] {
          min-height: calc(var(--spacing) * 4);
        }
      `}</style>
      <Page pageTitle={titleWrapper(translation('patients'))} noScrolling>
        <ContentPanel
          className="flex-1 min-h-0"
          titleElement={translation('patients')}
          description={(
            <PatientScopeCountChips
              total={scopedPatientsTotal}
              admitted={scopedPatientsAdmitted}
              waiting={scopedPatientsWaiting}
            />
          )}
        >
          <PatientList
            initialPatientId={patientId}
            onInitialPatientIdUsed={() => router.replace('/patients', undefined, { shallow: true })}
          />
        </ContentPanel>
      </Page>
    </>
  )
}

export default PatientsPage
