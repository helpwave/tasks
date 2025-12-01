import { SolidButton } from '@helpwave/hightide'

type LoginPageProps = {
    login: () => Promise<boolean>,
}

export const LoginPage = ({ login }: LoginPageProps) => {
    return (
        <div className="col bg-gray-100 max-w-[300px] p-8 gap-y-2 rounded-lg shadow-lg">
            <h2 className="font-bold font-inter text-2xl">Login</h2>
            <SolidButton onClick={login}>Click here.</SolidButton>
        </div>
    )
}
