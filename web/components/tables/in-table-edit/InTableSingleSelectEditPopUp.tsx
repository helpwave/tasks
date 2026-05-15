import type { ReactNode } from 'react'
import { useState, type ComponentProps } from 'react'
import type { ButtonProps } from '@helpwave/hightide'
import { Button, PopUp, PopUpContext, PopUpOpener, PopUpRoot, Select, SelectOption } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

type InTableSingleSelectEditPopUpProps = {
  definitionId: string,
  optionLabels: string[],
  value: string | null,
  onUpdate: (next: string | null) => void,
  buttonProps?: ButtonProps,
  children: ReactNode,
} & Partial<Pick<ComponentProps<typeof PopUp>, 'options' | 'className'>>

export function InTableSingleSelectEditPopUp({
  definitionId,
  optionLabels,
  value,
  onUpdate,
  buttonProps,
  children,
  options = { horizontalAlignment: 'afterStart', verticalAlignment: 'afterEnd' },
  className = 'p-2',
}: InTableSingleSelectEditPopUpProps) {
  const emptyTag = ''
  const [draft, setDraft] = useState<string>(value ?? emptyTag)
  const translation = useTasksTranslation()

  return (
    <PopUpRoot
      onIsOpenChange={open => {
        if (open) {
          setDraft(value ?? emptyTag)
        } else if (draft !== (value ?? emptyTag)) {
          onUpdate(draft === emptyTag ? null : draft)
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
      <PopUp options={options} className={clsx(className, 'flex-col-2 items-end min-w-56')} onClick={e => e.stopPropagation()}>
        <Select
          value={draft}
          onValueChange={next => {
            setDraft(next ?? emptyTag)
          }}
        >
          <SelectOption value={emptyTag} label={translation('none') || '—'} />
          {optionLabels.map((label, idx) => (
            <SelectOption
              key={`${definitionId}-opt-${idx}`}
              value={`${definitionId}-opt-${idx}`}
              label={label}
            />
          ))}
        </Select>
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
