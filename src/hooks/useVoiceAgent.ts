/**
 * useVoiceAgent — end-to-end voice interaction hook for Contra AI.
 *
 * Flow:
 *   startListening() → browser SpeechRecognition (STT)
 *                    → transcript appears
 *   sendToNemotron() → POST /api/voice/chat
 *                    → response text returned
 *   speak()          → window.speechSynthesis (TTS)
 *                    → sphere enters 'speaking' state
 *
 * The sphere's own microphone / audio-analyser is driven by the
 * `isListening` flag already wired in DashboardPage — this hook only
 * manages state, network, and TTS.  Audio capture inside the sphere
 * is handled by ContraAISphere.tsx itself.
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
  startListening: () => void
  stopListening: () => void
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
// Note: SpeechRecognition and webkitSpeechRecognition are accessed via window at runtime;
// declare stubs are omitted to avoid unused-vars lint warnings.

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
    signal: AbortSignal.timeout(35_000),
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
  const isMountedRef = useRef(true)

  // Detect reduced-motion preference once
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const isSpeechAvailable = Boolean(getSpeechRecognition())

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Cleanup on unmount
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
      if (!userText.trim()) return

      if (isMountedRef.current) {
        setTranscript(userText)
        setInterimTranscript('')
        setAgentState('thinking')
        setErrorMessage(null)
        setConversation((prev) => [
          ...prev,
          { role: 'user', content: userText, timestamp: Date.now() },
        ])
      }

      try {
        const historyPayload = conversation
          .slice(-10)
          .map(({ role, content }) => ({ role, content }))

        const result = await callVoiceChat({ message: userText, history: historyPayload })

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

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognition()
    if (!SpeechRecognitionCtor) {
      setErrorMessage('Speech recognition is not supported in this browser.')
      setAgentState('error')
      return
    }

    // Stop any ongoing recognition first
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    pendingFinalRef.current = ''

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
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (isMountedRef.current) {
        if (finalText) {
          pendingFinalRef.current += finalText
          setTranscript(pendingFinalRef.current)
        }
        setInterimTranscript(interim)
      }
    }

    recognition.onend = () => {
      if (!isMountedRef.current) return
      const finalUtterance = pendingFinalRef.current.trim()
      if (finalUtterance) {
        void sendToNemotron(finalUtterance)
      } else {
        setAgentState('idle')
      }
    }

    recognition.onerror = (e) => {
      if (!isMountedRef.current) return
      if (e.error === 'no-speech') {
        // User was silent — go back to idle quietly
        setAgentState('idle')
      } else if (e.error === 'not-allowed') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions.')
        setAgentState('error')
      } else {
        setErrorMessage(`Speech recognition error: ${e.error}`)
        setAgentState('error')
      }
    }

    recognition.start()
  }, [sendToNemotron])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (isMountedRef.current) {
      const finalUtterance = pendingFinalRef.current.trim()
      if (!finalUtterance) setAgentState('idle')
    }
  }, [])

  // ── Manual send (for typed messages) ─────────────────────────────────────

  const sendManual = useCallback(
    async (text: string) => {
      recognitionRef.current?.abort()
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
    stopSpeaking,
    clearConversation,
    sendManual,
  }
}
