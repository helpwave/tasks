import type { ReactElement } from 'react'
import { HelpwaveLogo } from '@helpwave/hightide'

export function CenteredLoadingLogo(): ReactElement {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[200px]">
      <HelpwaveLogo
        animate="loading"
        color="currentColor"
        height={128}
        width={128}
      />
    </div>
  )
}
