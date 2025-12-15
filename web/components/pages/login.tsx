import { Button } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type LoginPageProps = {
  login: () => Promise<boolean>,
}

export const LoginPage = ({ login }: LoginPageProps) => {
  const translation = useTasksTranslation()

  return (
    <main className="flex-col-0 w-screen h-screen items-center justify-center">
      <div className="flex-col-0 bg-surface text-on-surface max-w-[360px] p-8 gap-y-2 rounded-lg shadow-lg">
        <h1 className="font-bold font-inter text-2xl">{translation('loginRequired')}</h1>
        <span className="text-description">{translation('loginRequiredDescription')}</span>
        <Button onClick={login}>{translation('login')}</Button>
      </div>
    </main>
  )
}
