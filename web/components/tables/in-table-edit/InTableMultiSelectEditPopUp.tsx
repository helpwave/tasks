import type { ReactNode } from 'react'
import { useState, type ComponentProps } from 'react'
import type { ButtonProps } from '@helpwave/hightide'
import { Button, Checkbox, PopUp, PopUpContext, PopUpOpener, PopUpRoot } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

function sameTagSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

type InTableMultiSelectEditPopUpProps = {
  definitionId: string,
  optionLabels: string[],
  value: string[],
  onUpdate: (next: string[] | null) => void,
  buttonProps?: ButtonProps,
  children: ReactNode,
} & Partial<Pick<ComponentProps<typeof PopUp>, 'options' | 'className'>>

export function InTableMultiSelectEditPopUp({
  definitionId,
  optionLabels,
  value,
  onUpdate,
  buttonProps,
  children,
  options = { horizontalAlignment: 'afterStart', verticalAlignment: 'afterEnd' },
  className,
}: InTableMultiSelectEditPopUpProps) {
  const [draft, setDraft] = useState<string[]>(() => [...value])
  const translation = useTasksTranslation()

  const tags = optionLabels.map((_, idx) => `${definitionId}-opt-${idx}`)

  return (
    <PopUpRoot
      onIsOpenChange={open => {
        if (open) {
          setDraft([...value])
        } else if (!sameTagSet(draft, value)) {
          onUpdate(draft.length === 0 ? null : draft)
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
      <PopUp
        options={options}
        aria-label={translation('edit')}
        className={clsx('flex-col-2 items-stretch p-2 max-h-72 overflow-y-auto min-w-56', className)}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          {optionLabels.map((label, idx) => {
            const tag = tags[idx]
            return (
              <label key={tag} className="flex-row-2 items-center gap-2 cursor-pointer">
                <Checkbox
                  value={tag != null && draft.includes(tag)}
                  onValueChange={(checked) => {
                    if (checked) {
                      setDraft(prev => (tag != null && prev.includes(tag) ? prev : [...prev, tag ?? '']))
                    } else {
                      setDraft(prev => prev.filter(t => t !== tag))
                    }
                  }}
                />
                <span className="text-sm">{label}</span>
              </label>
            )
          })}
        </div>
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
