import { useState, useEffect, useRef, useMemo } from 'react'
import { Dialog, Button, Textarea, FormField, FormProvider, Checkbox, useCreateForm, useTranslatedValidators, useFormObserverKey } from '@helpwave/hightide'
import { useTasksTranslation, useLocale } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { Mic, Pause } from 'lucide-react'

interface FeedbackDialogProps {
  isOpen: boolean,
  onClose: () => void,
  hideUrl?: boolean,
}

type FeedbackFormValues = {
  url?: string,
  feedback: string,
  isAnonymous: boolean,
}

interface SpeechRecognitionEvent {
  resultIndex: number,
  results: Array<Array<{ transcript: string, isFinal?: boolean }>>,
}

interface SpeechRecognitionErrorEvent {
  error: string,
}

interface SpeechRecognitionInstance {
  continuous: boolean,
  interimResults: boolean,
  lang: string,
  start: () => void,
  stop: () => void,
  onresult: ((event: SpeechRecognitionEvent) => void) | null,
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null,
  onend: (() => void) | null,
}

export const FeedbackDialog = ({ isOpen, onClose, hideUrl = false }: FeedbackDialogProps) => {
  const translation = useTasksTranslation()
  const { locale } = useLocale()
  const { user } = useTasksContext()
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const isRecordingRef = useRef(false)
  const finalTranscriptRef = useRef('')
  const lastFinalLengthRef = useRef(0)
  const validators = useTranslatedValidators()



  const form = useCreateForm<FeedbackFormValues>({
    initialValues: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      feedback: '',
      isAnonymous: false,
    },
    validators:{
      feedback: validators.notEmpty
    },
    onFormSubmit: async (values) => {
      if (!values.feedback.trim()) return

      const feedbackData: {
        url?: string,
        feedback: string,
        timestamp: string,
        username: string,
        userId?: string,
      } = {
        feedback: values.feedback.trim(),
        timestamp: new Date().toISOString(),
        username: values.isAnonymous ? 'Anonymous' : (user?.name || 'Unknown User'),
        userId: values.isAnonymous ? undefined : user?.id,
      }

      if (!hideUrl) {
        feedbackData.url = values.url || (typeof window !== 'undefined' ? window.location.href : '')
      }

      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData),
        })

        if (response.ok) {
          form.update(prev => ({
            ...prev,
            feedback: '',
            isAnonymous: false,
          }))
          onClose()
        }
      } catch {
        void 0
      }
    },
  })

  const { update: updateForm } = form

  const isAnonymous = useFormObserverKey({ formStore: form.store, formKey: 'isAnonymous' })?.value ?? false

  const submissionName = useMemo(() => {
    if(isAnonymous) {
      return translation('anonymous')
    }
    return user?.name || 'Unknown User'
  }, [isAnonymous, translation, user?.name])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance,
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance,
      }
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = locale || navigator.language || 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ''
          let hasNewFinal = false

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i]
            if (result && result[0]) {
              const transcript = result[0].transcript
              const isFinal = result[0].isFinal ?? false

              if (isFinal) {
                finalTranscriptRef.current += transcript + ' '
                hasNewFinal = true
              } else {
                interimTranscript += transcript
              }
            }
          }

          if (hasNewFinal) {
            lastFinalLengthRef.current = finalTranscriptRef.current.length
          }

          const hasExistingFinal = finalTranscriptRef.current.trim().length > 0
          const hasInterim = interimTranscript.length > 0
          const noNewFinal = !hasNewFinal

          const needsParagraphBreak = hasExistingFinal && hasInterim && noNewFinal

          const displayText = needsParagraphBreak
            ? finalTranscriptRef.current.trim() + '\n\n' + interimTranscript
            : (finalTranscriptRef.current + interimTranscript).trim()

          updateForm(prev => ({ ...prev, feedback: displayText }))
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'no-speech') {
            return
          }
          if (event.error === 'aborted' || event.error === 'network') {
            isRecordingRef.current = false
            setIsRecording(false)
            return
          }
        }

        recognition.onend = () => {
          if (isRecordingRef.current) {
            try {
              recognitionRef.current?.start()
            } catch {
              setIsRecording(false)
              isRecordingRef.current = false
            }
          } else {
            setIsRecording(false)
          }
          lastFinalLengthRef.current = finalTranscriptRef.current.length
          updateForm(prev => ({ ...prev, feedback: finalTranscriptRef.current.trim() }))
        }

        recognitionRef.current = recognition
      }
    }
  }, [locale, updateForm])

  const handleToggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      isRecordingRef.current = false
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      finalTranscriptRef.current = ''
      lastFinalLengthRef.current = 0
      isRecordingRef.current = true
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      updateForm(prev => ({
        ...prev,
        feedback: '',
      }))
      finalTranscriptRef.current = ''
      lastFinalLengthRef.current = 0
      if (recognitionRef.current && isRecording) {
        isRecordingRef.current = false
        recognitionRef.current.stop()
        setIsRecording(false)
      }
    }
  }, [isOpen, isRecording, updateForm])

  useEffect(() => {
    if (isOpen && user) {
      updateForm(prev => ({
        ...prev,
        username: isAnonymous ? 'Anonymous' : (user.name || 'Unknown User'),
        userId: isAnonymous ? undefined : user.id,
      }))
    }
  }, [isOpen, user, updateForm, isAnonymous])

  return (
    <FormProvider state={form}>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        titleElement={translation('feedback') ?? 'Feedback'}
        description={translation('feedbackDescription') ?? 'Share your feedback, report bugs, or suggest improvements.'}
      >
        <form onSubmit={event => { event.preventDefault(); form.submit() }}>
          <div className="flex flex-col gap-4">
            {!hideUrl && (
              <FormField<FeedbackFormValues, 'url'>
                name="url"
                label={translation('url')}
              >
                {({ dataProps }) => (
                  <div className="text-description text-sm break-all">
                    {dataProps.value || (typeof window !== 'undefined' ? window.location.href : '')}
                  </div>
                )}
              </FormField>
            )}

            <FormField<FeedbackFormValues, 'isAnonymous'>
              name="isAnonymous"
              label={translation('submissionDetails')}
            >
              {({ dataProps, focusableElementProps, interactionStates }) => (
                <div className="flex-col-2 gap-2">
                  <span className="text-description">
                    {translation('submittingAs', { name: submissionName })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      {...dataProps}
                      {...focusableElementProps}
                      {...interactionStates}
                      size="sm"
                    />
                    <span className="text-description">
                      {translation('anonymousSubmission')}
                    </span>
                  </div>
                </div>
              )}
            </FormField>

            <FormField<FeedbackFormValues, 'feedback'>
              name="feedback"
              label={translation('feedback')}
            >
              {({ dataProps, focusableElementProps, interactionStates }) => (
                <div className="relative">
                  <Textarea
                    {...dataProps} {...focusableElementProps} {...interactionStates}
                    value={dataProps.value || ''}
                    placeholder={translation('enterFeedback')}
                    rows={6}
                    className="pr-12 pb-3"
                  />
                  {isSupported && (
                    <Button
                      color={isRecording ? 'negative' : 'primary'}
                      coloringStyle={isRecording ? 'solid' : 'tonal'}
                      onClick={handleToggleRecording}
                      className="absolute bottom-3 right-3 rounded-full"
                      title={isRecording ? translation('stopRecording') : translation('startRecording')}
                    >
                      {isRecording ? <Pause className="size-4" /> : <Mic className="size-4" />}
                    </Button>
                  )}
                </div>
              )}
            </FormField>

            <div className="flex-row-2 justify-end gap-2">
              <Button
                color="neutral"
                coloringStyle="outline"
                onClick={onClose}
              >
                {translation('cancel')}
              </Button>
              <Button
                color="primary"
                onClick={() => form.submit()}
              >
                {translation('submit')}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </FormProvider>
  )
}
