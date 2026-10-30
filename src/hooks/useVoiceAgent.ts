/**
 * useVoiceAgent — end-to-end voice interaction hook for Contra AI.
 *
 * Flow:
 *   startListening() -> browser SpeechRecognition (STT)
 *                    -> recognized speech updates chatbox in real time for review/editing
 *   sendManual()     -> POST /api/voice/chat (NVIDIA Nemotron via Nebius)
 *                    -> response returned & added to conversation context
 *   speak()          -> window.speechSynthesis (TTS)
 *                    -> neural sphere enters 'speaking' state
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type VoiceAgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export interface VoiceTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface UseVoiceAgentReturn {
  agentState: VoiceAgentState
  transcript: string
  interimTranscript: string
  lastResponse: string
  conversation: VoiceTurn[]
  errorMessage: string | null
  isSpeechAvailable: boolean
  startListening: (onUpdate?: (transcript: string, isFinal: boolean) => void) => void
  stopListening: () => void
  speak: (text: string, onDone?: () => void) => void
  stopSpeaking: () => void
  clearConversation: () => void
  sendManual: (text: string) => Promise<void>
}

// ── Browser speech-recognition shim ─────────────────────────────────────────

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  onresult: ((e: SpeechRecognitionEvent) => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (
    (w['SpeechRecognition'] as SpeechRecognitionConstructor | undefined) ??
    (w['webkitSpeechRecognition'] as SpeechRecognitionConstructor | undefined) ??
    null
  )
}

// ── API helper ───────────────────────────────────────────────────────────────

interface VoiceChatPayload {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

interface VoiceChatResult {
  response: string
  mock: boolean
}

async function callVoiceChat(payload: VoiceChatPayload): Promise<VoiceChatResult> {
  const res = await fetch('/api/voice/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Voice API error (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<VoiceChatResult>
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceAgent(): UseVoiceAgentReturn {
  const [agentState, setAgentState] = useState<VoiceAgentState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [lastResponse, setLastResponse] = useState('')
  const [conversation, setConversation] = useState<VoiceTurn[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const pendingFinalRef = useRef('')
  const latestHeardRef = useRef('')
  const isMountedRef = useRef(true)
  const onTranscriptCallbackRef = useRef<((text: string, isFinal: boolean) => void) | null>(null)

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const isSpeechAvailable = Boolean(getSpeechRecognition())

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
    }
  }, [])

  // ── TTS ────────────────────────────────────────────────────────────────────

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!('speechSynthesis' in window) || !text.trim()) {
        onDone?.()
        return
      }
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = prefersReducedMotion ? 1.0 : 1.05
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        if (isMountedRef.current) setAgentState('speaking')
      }
      utterance.onend = () => {
        if (isMountedRef.current) setAgentState('idle')
        onDone?.()
      }
      utterance.onerror = () => {
        if (isMountedRef.current) setAgentState('idle')
        onDone?.()
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [prefersReducedMotion],
  )

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    if (isMountedRef.current) setAgentState('idle')
  }, [])

  // ── Backend call ───────────────────────────────────────────────────────────

  const sendToNemotron = useCallback(
    async (userText: string) => {
      const clean = userText.trim()
      if (!clean) {
        if (isMountedRef.current) setAgentState('idle')
        return
      }

      if (isMountedRef.current) {
        setTranscript(clean)
        setInterimTranscript('')
        setAgentState('thinking')
        setErrorMessage(null)
        setConversation((prev) => [
          ...prev,
          { role: 'user', content: clean, timestamp: Date.now() },
        ])
      }

      try {
        const historyPayload = conversation
          .slice(-6)
          .map(({ role, content }) => ({ role, content }))

        const result = await callVoiceChat({ message: clean, history: historyPayload })

        if (!isMountedRef.current) return

        setLastResponse(result.response)
        setConversation((prev) => [
          ...prev,
          { role: 'assistant', content: result.response, timestamp: Date.now() },
        ])

        speak(result.response)
      } catch (err) {
        if (!isMountedRef.current) return
        const msg = err instanceof Error ? err.message : 'Unknown error from voice backend.'
        setErrorMessage(msg)
        setAgentState('error')
      }
    },
    [conversation, speak],
  )

  // ── STT ────────────────────────────────────────────────────────────────────

  const startListening = useCallback(
    (onUpdate?: (transcript: string, isFinal: boolean) => void) => {
      const SpeechRecognitionCtor = getSpeechRecognition()
      if (!SpeechRecognitionCtor) {
        setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.')
        setAgentState('error')
        return
      }

      try {
        recognitionRef.current?.abort()
      } catch {
        // ignore
      }
      window.speechSynthesis?.cancel()

      if (onUpdate) {
        onTranscriptCallbackRef.current = onUpdate
      }

      const recognition = new SpeechRecognitionCtor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      pendingFinalRef.current = ''
      latestHeardRef.current = ''

      recognition.onstart = () => {
        if (isMountedRef.current) {
          setAgentState('listening')
          setTranscript('')
          setInterimTranscript('')
          setErrorMessage(null)
        }
      }

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        let interim = ''
        let currentFinal = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i]
          if (result && result[0]) {
            if (result.isFinal) {
              currentFinal += result[0].transcript
            } else {
              interim += result[0].transcript
            }
          }
        }

        if (isMountedRef.current) {
          if (currentFinal) {
            const separator = pendingFinalRef.current ? ' ' : ''
            pendingFinalRef.current += separator + currentFinal.trim()
            latestHeardRef.current = pendingFinalRef.current
            setTranscript(pendingFinalRef.current)
            onTranscriptCallbackRef.current?.(pendingFinalRef.current, true)
          } else if (interim) {
            latestHeardRef.current = interim
            const combined = pendingFinalRef.current
              ? `${pendingFinalRef.current} ${interim}`
              : interim
            onTranscriptCallbackRef.current?.(combined, false)
          }
          setInterimTranscript(interim)
        }
      }

      recognition.onend = () => {
        if (!isMountedRef.current) return
        // Do not auto-submit on end. Transcribed speech populates the input field
        // so the user can review, edit, or clear before sending.
        setAgentState('idle')
      }

      recognition.onerror = (e) => {
        if (!isMountedRef.current) return
        if (e.error === 'no-speech') {
          setAgentState('idle')
        } else if (e.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in browser settings.')
          setAgentState('error')
        } else {
          setErrorMessage(`Microphone error: ${e.error}`)
          setAgentState('error')
        }
      }

      try {
        recognition.start()
      } catch (err) {
        console.warn('Recognition start exception:', err)
        setErrorMessage('Could not activate microphone. Tap to retry.')
        setAgentState('error')
      }
    },
    [],
  )

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore
    }
    recognitionRef.current = null
    if (isMountedRef.current) {
      setAgentState('idle')
    }
  }, [])

  // ── Manual send (for typed or reviewed speech messages) ───────────────────

  const sendManual = useCallback(
    async (text: string) => {
      try {
        recognitionRef.current?.abort()
      } catch {
        // ignore
      }
      await sendToNemotron(text)
    },
    [sendToNemotron],
  )

  const clearConversation = useCallback(() => {
    setConversation([])
    setTranscript('')
    setInterimTranscript('')
    setLastResponse('')
    setErrorMessage(null)
    setAgentState('idle')
  }, [])

  return {
    agentState,
    transcript,
    interimTranscript,
    lastResponse,
    conversation,
    errorMessage,
    isSpeechAvailable,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearConversation,
    sendManual,
  }
}
