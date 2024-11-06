'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trash2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Question {
  id: number
  text: string
  key: 'about' | 'interests' | 'hobbies'
}

const questions: Question[] = [
  { id: 1, text: 'Tell me about yourself', key: 'about' },
  { id: 2, text: 'What are your interests?', key: 'interests' },
  { id: 3, text: 'What are your hobbies?', key: 'hobbies' }
]

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [recordings, setRecordings] = useState<Record<string, Blob>>({})
  const [transcriptions, setTranscriptions] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      })
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })
      
      let chunks: BlobPart[] = []
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
        setRecordings(prev => ({
          ...prev,
          [questions[currentStep].key]: blob
        }))
        chunks = []
        setTranscriptions(prev => ({
          ...prev,
          [questions[currentStep].key]: ''
        }))
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setTimeLeft(10)

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast({
        title: 'Failed to access microphone',
        description: 'Please check your browser permissions and try again.',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const deleteRecording = (key: string) => {
    setRecordings(prev => {
      const newRecordings = { ...prev }
      delete newRecordings[key]
      return newRecordings
    })
    setTranscriptions(prev => {
      const newTranscriptions = { ...prev }
      delete newTranscriptions[key]
      return newTranscriptions
    })
  }

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      await handleSubmit()
      setCurrentStep(prev => prev + 1)
    } else {
      await handleSubmit()
      toast({
        title: 'All responses submitted successfully!',
        description: 'Thank you for completing the onboarding.',
      })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const currentKey = questions[currentStep].key
      const audioBlob = recordings[currentKey]
      
      const formData = new FormData()
      formData.append('audio', audioBlob, `${currentKey}.webm`)
      formData.append('questionKey', currentKey)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const data = await response.json()
      
      if (data.text) {
        setTranscriptions(prev => ({
          ...prev,
          [currentKey]: data.text
        }))
        toast({
          title: 'Response recorded',
          description: 'Your answer has been saved.',
        })
      }
    } catch (error) {
      console.error('Error submitting recording:', error)
      toast({
        title: 'Failed to transcribe audio',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const allResponsesComplete = Object.keys(transcriptions).length === questions.length

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <Card className="p-6 space-y-6">
        <Progress value={(currentStep + 1) / questions.length * 100} />
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            {questions[currentStep].text}
          </h2>
          
          <div className="space-y-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="w-full"
              disabled={isSubmitting}
            >
              {isRecording ? `Recording (${timeLeft}s)` : 'Start Recording'}
            </Button>

            {recordings[questions[currentStep].key] && (
              <div className="space-y-3 rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2">
                  <audio
                    src={URL.createObjectURL(recordings[questions[currentStep].key])}
                    controls
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startRecording()}
                    disabled={isSubmitting}
                    title="Re-record"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteRecording(questions[currentStep].key)}
                    disabled={isSubmitting}
                    title="Delete recording"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {transcriptions[questions[currentStep].key] && (
                  <div className="p-4 bg-background rounded-md border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Transcription:</p>
                    <p className="text-sm leading-relaxed">
                      {transcriptions[questions[currentStep].key]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0 || isSubmitting}
              className="w-full"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!recordings[questions[currentStep].key] || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Processing...' : currentStep === questions.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary of all responses */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Responses</h3>
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {question.text}
              </p>
              {transcriptions[question.key] ? (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    {transcriptions[question.key]}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {currentStep >= question.id ? 'Recording pending...' : 'Not recorded yet'}
                </p>
              )}
            </div>
          ))}
        </div>

        {allResponsesComplete && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-sm font-medium text-green-600">
              ✓ All responses completed!
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}