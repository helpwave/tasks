import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { IconButton } from '@helpwave/hightide'

interface SidePanelProps {
  isOpen: boolean,
  onClose: () => void,
  title?: ReactNode,
  children: ReactNode,
}

export const SidePanel = ({ isOpen, onClose, title, children }: SidePanelProps) => {
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen) setIsVisible(true)
  }, [isOpen])

  const handleAnimationEnd = () => {
    if (!isOpen) setIsVisible(false)
  }

  if (!isVisible) return null

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className={clsx(
          'absolute inset-0 bg-overlay-shadow transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          'absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none'
        )}
      >
        <div
          className={clsx(
            'pointer-events-auto w-screen md:w-[40vw] transform transition-transform duration-300 ease-in-out',
            isOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          onTransitionEnd={handleAnimationEnd}
        >
          <div className="flex h-full flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-divider min-h-[80px]">
              {title && <div className="text-lg font-medium text-text-primary flex-1">{title}</div>}
              <div className="ml-auto">
                <IconButton color="transparent" onClick={onClose}>
                  <X className="h-6 w-6" />
                </IconButton>
              </div>
            </div>
            <div className="relative flex-1 px-4 py-6 sm:px-6 overflow-y-auto flex flex-col">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
