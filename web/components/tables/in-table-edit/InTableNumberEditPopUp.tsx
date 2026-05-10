import type { ReactNode } from 'react'
import { useState, type ComponentProps } from 'react'
import type { ButtonProps } from '@helpwave/hightide'
import { Button, Input, PopUp, PopUpContext, PopUpOpener, PopUpRoot } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

function sameNumber(a: number | null, b: number | null): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a === b
}

type InTableNumberEditPopUpProps = {
  value: number | null,
  onUpdate: (next: number | null) => void,
  buttonProps?: ButtonProps,
  children: ReactNode,
} & Partial<Pick<ComponentProps<typeof PopUp>, 'options' | 'className'>>

export function InTableNumberEditPopUp({
  value,
  onUpdate,
  buttonProps,
  children,
  options = { horizontalAlignment: 'afterStart', verticalAlignment: 'afterEnd' },
  className = 'p-2',
}: InTableNumberEditPopUpProps) {
  const [draft, setDraft] = useState<string>(() => (value != null ? String(value) : ''))
  const translation = useTasksTranslation()

  const parsedDraft = ((): number | null => {
    const t = draft.trim()
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  })()

  return (
    <PopUpRoot
      onIsOpenChange={open => {
        if (open) {
          setDraft(value != null ? String(value) : '')
        } else if (!sameNumber(parsedDraft, value)) {
          onUpdate(parsedDraft)
        }
      }}
    >
      <PopUpOpener<HTMLButtonElement>>
        {({ props }) => {
          const { ref: openerRef, ...openerButtonProps } = props
          return (
            <Button
              color="neutral"
              size="sm"
              coloringStyle="text"
              {...buttonProps}
              {...openerButtonProps}
              ref={openerRef}
            >
              {children}
            </Button>
          )
        }}
      </PopUpOpener>
      <PopUp options={options} className={clsx(className, 'flex-col-2 items-end min-w-48')} onClick={e => e.stopPropagation()}>
        <Input
          type="number"
          value={draft}
          onValueChange={next => {
            setDraft(next)
          }}
        />
        <PopUpContext.Consumer>
          {({ setIsOpen }) => (
            <div className="flex-row-2 justify-end items-center gap-x-2">
              <Button color="neutral" size="sm" onClick={() => {
                setIsOpen(false)
              }}>
                {translation('cancel')}
              </Button>
              <Button color="primary" size="sm" onClick={() => {
                setIsOpen(false)
              }}>
                {translation('done')}
              </Button>
            </div>
          )}
        </PopUpContext.Consumer>
      </PopUp>
    </PopUpRoot>
  )
}
