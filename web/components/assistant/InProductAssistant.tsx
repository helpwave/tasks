'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Drawer,
  ExpandableContent,
  ExpandableHeader,
  ExpandableRoot,
  Tooltip
} from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useStorage } from '@/hooks/useStorage'
import { consumeOpenAiCompatibleSseStream } from '@/utils/assistantChatStream'
import clsx from 'clsx'
import { Sparkles, Trash2 } from 'lucide-react'

export type AssistantFocus = 'general' | 'tasks' | 'patients'

type ChatMessage = { role: 'user' | 'assistant', content: string }

type InProductAssistantProps = {
  isOpen: boolean,
  onClose: () => void,
}

const STORAGE_KEY_API_KEY = 'helpwave-assistant-api-key'
const STORAGE_KEY_MODEL = 'helpwave-assistant-model'
const STORAGE_KEY_BASE_URL = 'helpwave-assistant-base-url'
const STORAGE_KEY_FOCUS = 'helpwave-assistant-focus'

const stringStorage = {
  serialize: (v: string) => v,
  deserialize: (raw: string) => raw,
}

export const InProductAssistant = ({ isOpen, onClose }: InProductAssistantProps) => {
  const translation = useTasksTranslation()
  const { value: apiKey, setValue: setApiKey } = useStorage<string>({
    key: STORAGE_KEY_API_KEY,
    defaultValue: '',
    serialize: stringStorage.serialize,
    deserialize: stringStorage.deserialize,
  })
  const { value: model, setValue: setModel } = useStorage<string>({
    key: STORAGE_KEY_MODEL,
    defaultValue: 'gpt-4o-mini',
    serialize: stringStorage.serialize,
    deserialize: stringStorage.deserialize,
  })
  const { value: baseUrl, setValue: setBaseUrl } = useStorage<string>({
    key: STORAGE_KEY_BASE_URL,
    defaultValue: '',
    serialize: stringStorage.serialize,
    deserialize: stringStorage.deserialize,
  })
  const { value: focusStored, setValue: setFocusStored } = useStorage<string>({
    key: STORAGE_KEY_FOCUS,
    defaultValue: '',
    serialize: stringStorage.serialize,
    deserialize: stringStorage.deserialize,
  })

  const [draftKey, setDraftKey] = useState('')
  const [draftModel, setDraftModel] = useState('')
  const [draftBaseUrl, setDraftBaseUrl] = useState('')
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setDraftKey(apiKey)
    setDraftModel(model || 'gpt-4o-mini')
    setDraftBaseUrl(baseUrl)
    setSettingsExpanded(!apiKey.trim())
  }, [isOpen, apiKey, model, baseUrl])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const focus: AssistantFocus | '' =
    focusStored === 'general' || focusStored === 'tasks' || focusStored === 'patients'
      ? focusStored
      : ''

  const setFocus = useCallback(
    (next: AssistantFocus | '') => {
      setFocusStored(next)
    },
    [setFocusStored]
  )

  const saveSettings = useCallback(() => {
    setApiKey(draftKey.trim())
    setModel(draftModel.trim() || 'gpt-4o-mini')
    setBaseUrl(draftBaseUrl.trim())
    setSettingsExpanded(false)
  }, [draftKey, draftModel, draftBaseUrl, setApiKey, setModel, setBaseUrl])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text) {
      setError(translation('assistantEmptyMessage'))
      return
    }
    if (!apiKey.trim()) {
      setError(translation('assistantNoApiKey'))
      return
    }
    if (!focus) {
      setError(translation('assistantSelectFocus'))
      return
    }

    setError(null)
    setLoading(true)
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          model: model.trim() || 'gpt-4o-mini',
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || undefined,
          focus,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? translation('assistantErrorGeneric'))
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('text/event-stream')) {
        setError(translation('assistantErrorGeneric'))
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        await consumeOpenAiCompatibleSseStream(res, (delta) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (!last || last.role !== 'assistant') {
              return prev
            }
            return [...prev.slice(0, -1), { role: 'assistant', content: last.content + delta }]
          })
        })
      } catch {
        setError(translation('assistantErrorGeneric'))
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          const second = prev[prev.length - 2]
          if (last?.role === 'assistant' && second?.role === 'user') {
            if (last.content.trim() === '') {
              return prev.slice(0, -2)
            }
            return prev
          }
          return prev
        })
        return
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content.trim() === '') {
          return [...prev.slice(0, -1), { role: 'assistant', content: '—' }]
        }
        return prev
      })
    } catch {
      setError(translation('assistantErrorGeneric'))
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [apiKey, baseUrl, focus, input, messages, model, translation])

  const applyStarter = useCallback((body: string) => {
    setInput(body)
    setError(null)
  }, [])

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      alignment="right"
      titleElement={translation('assistantTitle')}
      description={undefined}
    >
      <div className="flex flex-col gap-4 min-h-0 h-[calc(100dvh-8rem)] max-w-lg">
        <p className="typography-body-sm text-description shrink-0">{translation('assistantDemoNotice')}</p>

        <ExpandableRoot
          className="shadow-none border border-divider rounded-lg shrink-0"
          isExpanded={settingsExpanded}
          onExpandedChange={setSettingsExpanded}
        >
          <ExpandableHeader className="px-3 py-2">
            <span className="typography-label-lg">{translation('assistantConfigure')}</span>
          </ExpandableHeader>
          <ExpandableContent className="flex-col-3 px-3 pb-3 !gap-3">
            <label className="flex-col-1">
              <span className="typography-label-sm text-description">{translation('assistantApiKey')}</span>
              <input
                type="password"
                autoComplete="off"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                className="w-full rounded-md border border-divider bg-surface px-3 py-2 typography-body-sm"
                placeholder="sk-…"
              />
              <span className="typography-body-xs text-description">{translation('assistantApiKeyHint')}</span>
            </label>
            <label className="flex-col-1">
              <span className="typography-label-sm text-description">{translation('assistantModel')}</span>
              <input
                type="text"
                value={draftModel}
                onChange={(e) => setDraftModel(e.target.value)}
                className="w-full rounded-md border border-divider bg-surface px-3 py-2 typography-body-sm"
              />
              <span className="typography-body-xs text-description">{translation('assistantModelHint')}</span>
            </label>
            <label className="flex-col-1">
              <span className="typography-label-sm text-description">{translation('assistantBaseUrl')}</span>
              <input
                type="url"
                value={draftBaseUrl}
                onChange={(e) => setDraftBaseUrl(e.target.value)}
                className="w-full rounded-md border border-divider bg-surface px-3 py-2 typography-body-sm"
                placeholder="https://api.openai.com/v1"
              />
              <span className="typography-body-xs text-description">{translation('assistantBaseUrlHint')}</span>
            </label>
            <Button type="button" onClick={saveSettings}>
              {translation('assistantSaveKey')}
            </Button>
          </ExpandableContent>
        </ExpandableRoot>

        <div className="flex-col-2 shrink-0">
          <label className="flex-col-1" htmlFor="assistant-focus">
            <span className="typography-label-lg">{translation('assistantFocusLabel')}</span>
            <select
              id="assistant-focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value as AssistantFocus | '')}
              className="w-full rounded-md border border-divider bg-surface px-3 py-2 typography-body-sm"
            >
              <option value="">{translation('assistantFocusPlaceholder')}</option>
              <option value="general">{translation('assistantFocusGeneral')}</option>
              <option value="tasks">{translation('assistantFocusTasks')}</option>
              <option value="patients">{translation('assistantFocusPatients')}</option>
            </select>
          </label>
          <p className="typography-body-xs text-description">{translation('assistantFocusHint')}</p>
        </div>

        <div className="flex-col-2 shrink-0">
          <span className="typography-label-sm text-description">{translation('assistantSuggestedPrompts')}</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              color="neutral"
              coloringStyle="outline"
              className="text-left h-auto min-h-0 py-1.5 px-2 whitespace-normal max-w-full"
              onClick={() => applyStarter(translation('assistantStarterTaskHowTo'))}
            >
              {translation('assistantStarterTaskHowTo')}
            </Button>
            <Button
              type="button"
              color="neutral"
              coloringStyle="outline"
              className="text-left h-auto min-h-0 py-1.5 px-2 whitespace-normal max-w-full"
              onClick={() => applyStarter(translation('assistantStarterPatientOverview'))}
            >
              {translation('assistantStarterPatientOverview')}
            </Button>
            <Button
              type="button"
              color="neutral"
              coloringStyle="outline"
              className="text-left h-auto min-h-0 py-1.5 px-2 whitespace-normal max-w-full"
              onClick={() => applyStarter(translation('assistantStarterLocationScope'))}
            >
              {translation('assistantStarterLocationScope')}
            </Button>
          </div>
        </div>

        <div className="flex-row-2 justify-end shrink-0">
          <Tooltip tooltip={translation('assistantClearChat')}>
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg text-on-background hover:bg-surface-hover"
              onClick={() => {
                setMessages([])
                setError(null)
              }}
            >
              <Trash2 className="size-5" aria-hidden />
            </button>
          </Tooltip>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto flex-col-3 rounded-lg border border-divider p-3 bg-background">
          {messages.length === 0 && (
            <p className="typography-body-sm text-description">{translation('assistantInputPlaceholder')}</p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={clsx(
                'rounded-lg px-3 py-2 typography-body-sm whitespace-pre-wrap',
                m.role === 'user' ? 'bg-primary/15 text-on-surface ml-4' : 'bg-surface mr-4 border border-divider'
              )}
            >
              {m.content}
            </div>
          ))}
          {loading &&
            messages[messages.length - 1]?.role === 'assistant' &&
            messages[messages.length - 1]?.content === '' && (
            <p className="typography-body-sm text-description">{translation('assistantSending')}</p>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="typography-body-sm text-negative shrink-0">{error}</p>}

        <div className="flex-col-2 shrink-0">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-divider bg-surface px-3 py-2 typography-body-sm resize-none"
            placeholder={translation('assistantInputPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <Button type="button" onClick={() => void send()} disabled={loading}>
            {translation('assistantSend')}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

export const AssistantHeaderButton = ({
  onClick,
}: {
  onClick: () => void,
}) => {
  const translation = useTasksTranslation()
  return (
    <Tooltip tooltip={translation('assistantTooltip')}>
      <button
        type="button"
        className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg text-on-background hover:bg-surface-hover"
        onClick={onClick}
      >
        <Sparkles className="size-5" aria-hidden />
      </button>
    </Tooltip>
  )
}
