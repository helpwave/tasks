import { useState, useEffect, useRef } from 'react'
import { Dialog, Button, Textarea, FormElementWrapper, Checkbox } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { Mic, Pause } from 'lucide-react'
import clsx from 'clsx'

interface FeedbackDialogProps {
  isOpen: boolean,
  onClose: () => void,
  hideUrl?: boolean,
}

interface SpeechRecognitionEvent {
  resultIndex: number,
  results: Array<Array<{ transcript: string }>>,
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
  const { user } = useTasksContext()
  const [feedback, setFeedback] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const isRecordingRef = useRef(false)

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
        recognition.lang = navigator.language || 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result && result[0]) {
              transcript += result[0].transcript
            }
          }
          setFeedback(prev => prev + transcript)
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'no-speech') {
            return
          }
          if (event.error === 'aborted' || event.error === 'network') {
            console.error('Speech recognition error:', event.error)
            isRecordingRef.current = false
            setIsRecording(false)
            return
          }
          console.error('Speech recognition error:', event.error)
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
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  const handleToggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      isRecordingRef.current = false
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      isRecordingRef.current = true
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setFeedback('')
      setIsAnonymous(false)
      if (recognitionRef.current && isRecording) {
        isRecordingRef.current = false
        recognitionRef.current.stop()
        setIsRecording(false)
      }
    }
  }, [isOpen, isRecording])

  const handleSubmit = async () => {
    if (!feedback.trim()) return

    const feedbackData: {
      url?: string,
      feedback: string,
      timestamp: string,
      username: string,
      userId?: string,
    } = {
      feedback: feedback.trim(),
      timestamp: new Date().toISOString(),
      username: isAnonymous ? 'Anonymous' : (user?.name || 'Unknown User'),
      userId: user?.id,
    }

    if (!hideUrl) {
      feedbackData.url = typeof window !== 'undefined' ? window.location.href : ''
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
        setFeedback('')
        setIsAnonymous(false)
        onClose()
      } else {
        console.error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement={translation('feedback') ?? 'Feedback'}
      description={translation('feedbackDescription') ?? 'Share your feedback, report bugs, or suggest improvements.'}
    >
      <div className="flex flex-col gap-4">
        {!hideUrl && (
          <FormElementWrapper label={translation('url') ?? 'URL'}>
            {() => (
              <div className="text-description text-sm break-all">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </div>
            )}
          </FormElementWrapper>
        )}

        <FormElementWrapper label="">
          {() => (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <span className="text-sm text-description">
                {translation('submitAnonymously') ?? 'Submit anonymously'}
              </span>
            </div>
          )}
        </FormElementWrapper>

        <FormElementWrapper label={translation('feedback') ?? 'Feedback'}>
          {() => (
            <div className="relative">
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={translation('enterFeedback') ?? 'Enter your feedback here...'}
                rows={6}
                className="pr-12 pb-3"
              />
              {isSupported && (
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={clsx(
                    'absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 rounded-full hover:rounded-full transition-all',
                    isRecording ? 'text-negative hover:text-negative hover:bg-negative/10' : 'text-description hover:text-on-background hover:bg-surface-subdued'
                  )}
                  title={isRecording ? translation('stopRecording') ?? 'Stop Recording' : translation('startRecording') ?? 'Start Recording'}
                >
                  {isRecording ? <Pause className="size-4" /> : <Mic className="size-4" />}
                </button>
              )}
            </div>
          )}
        </FormElementWrapper>

        <div className="flex-row-2 justify-end gap-2">
          <Button
            color="neutral"
            coloringStyle="outline"
            onClick={onClose}
          >
            {translation('cancel') ?? 'Cancel'}
          </Button>
          <Button
            color="primary"
            onClick={handleSubmit}
            disabled={!feedback.trim()}
          >
            {translation('submit') ?? 'Submit'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}


