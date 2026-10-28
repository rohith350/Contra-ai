import { useState, useRef, useEffect, useId, type FormEvent, type ChangeEvent, type KeyboardEvent } from 'react'
import '../styles/ChatGPTComposer.css'

export interface AttachedSource {
  id: string
  type: 'file' | 'url' | 'text'
  name: string
  detail?: string
  contentSnippet?: string
}

interface ChatGPTComposerProps {
  hypothesis: string
  onHypothesisChange: (value: string) => void
  onInvestigate: (hypothesis: string, sources: AttachedSource[]) => void
  isResearching: boolean
  isListening: boolean
  onListeningChange: (listening: boolean) => void
  placeholder?: string
}

// Global declaration for SpeechRecognition in browsers
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionInstanceLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstanceLike

export function ChatGPTComposer({
  hypothesis,
  onHypothesisChange,
  onInvestigate,
  isResearching,
  isListening,
  onListeningChange,
  placeholder = 'Enter a hypothesis to investigate...',
}: ChatGPTComposerProps) {
  const [sources, setSources] = useState<AttachedSource[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [pasteModalOpen, setPasteModalOpen] = useState(false)
  const [pastedTitle, setPastedTitle] = useState('')
  const [pastedContent, setPastedContent] = useState('')
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [isSpeechAvailable] = useState(() => {
    if (typeof window === 'undefined') return false
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
    return Boolean(SpeechRecognition)
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const speechRecognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null)
  const inputId = useId()

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [hypothesis])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort()
        } catch {
          // ignore cleanup abort error
        }
      }
    }
  }, [])

  // Voice Input Handlers
  const toggleVoiceRecording = () => {
    if (isListening) {
      // Stop recording
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop()
        } catch {
          // ignore stop error
        }
      }
      onListeningChange(false)
      return
    }

    // Start recording
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your claim.')
      setTimeout(() => setSpeechError(null), 4000)
      return
    }

    try {
      setSpeechError(null)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        onListeningChange(true)
      }

      recognition.onend = () => {
        onListeningChange(false)
      }

      recognition.onerror = (e) => {
        onListeningChange(false)
        if (e.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.')
        } else if (e.error === 'no-speech') {
          setSpeechError('No speech detected. Please try speaking again.')
        } else {
          setSpeechError(`Voice capture error: ${e.error}`)
        }
        setTimeout(() => setSpeechError(null), 4500)
      }

      recognition.onresult = (e: SpeechRecognitionEventLike) => {
        let transcript = ''
        for (let i = 0; i < Object.keys(e.results).length; i++) {
          transcript += e.results[i][0].transcript
        }
        if (transcript.trim()) {
          onHypothesisChange(transcript)
        }
      }

      speechRecognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('Voice capture initialization error:', err)
      onListeningChange(false)
      setSpeechError('Failed to initialize microphone access.')
      setTimeout(() => setSpeechError(null), 4000)
    }
  }

  // File Upload Handlers (PDF, TXT, MD, max 10MB)
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newSources: AttachedSource[] = []
    const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown', '.json', '.csv']
    const maxSize = 10 * 1024 * 1024 // 10MB

    Array.from(files).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        setSpeechError(`Unsupported file format "${file.name}". Please use PDF, TXT, or MD documents.`)
        setTimeout(() => setSpeechError(null), 4000)
        return
      }

      if (file.size > maxSize) {
        setSpeechError(`File "${file.name}" exceeds 10MB limit.`)
        setTimeout(() => setSpeechError(null), 4000)
        return
      }

      newSources.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'file',
        name: file.name,
        detail: `${(file.size / 1024).toFixed(1)} KB`,
      })
    })

    if (newSources.length > 0) {
      setSources((prev) => [...prev, ...newSources])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setMenuOpen(false)
  }

  // URL Source Handlers
  const handleAddUrl = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = urlInput.trim()
    if (!trimmed) return

    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      setSources((prev) => [
        ...prev,
        {
          id: `url-${Date.now()}`,
          type: 'url',
          name: parsed.hostname,
          detail: parsed.href,
        },
      ])
      setUrlInput('')
      setUrlError('')
      setUrlModalOpen(false)
    } catch {
      setUrlError('Please enter a valid website URL (e.g. nature.com/articles/...)')
    }
  }

  // Paste Text Source Handlers
  const handleAddPastedText = (e: FormEvent) => {
    e.preventDefault()
    if (!pastedContent.trim()) return

    const title = pastedTitle.trim() || `Pasted Excerpt (${pastedContent.trim().slice(0, 24)}...)`
    setSources((prev) => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        type: 'text',
        name: title,
        detail: `${pastedContent.trim().length} chars`,
        contentSnippet: pastedContent.trim().slice(0, 300),
      },
    ])

    setPastedTitle('')
    setPastedContent('')
    setPasteModalOpen(false)
  }

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = hypothesis.trim()
    if (!trimmed || isResearching) return
    onInvestigate(trimmed, sources)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="chatgpt-composer-root">
      {/* Hidden real file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept=".pdf,.txt,.md,.markdown,.json,.csv"
        className="hidden-file-input"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Speech or validation feedback alert */}
      {speechError && (
        <div className="composer-alert-banner" role="alert">
          <span className="alert-icon">!</span>
          <span className="alert-msg">{speechError}</span>
          <button
            type="button"
            className="alert-dismiss"
            onClick={() => setSpeechError(null)}
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        </div>
      )}

      {/* Attached Source Chips Preview */}
      {sources.length > 0 && (
        <div className="composer-attachments-row" aria-label="Attached research sources">
          {sources.map((src) => (
            <div key={src.id} className="attachment-chip">
              <span className="chip-icon" aria-hidden="true">
                {src.type === 'file' && '📄'}
                {src.type === 'url' && '🔗'}
                {src.type === 'text' && '📝'}
              </span>
              <span className="chip-name" title={src.detail || src.name}>
                {src.name}
              </span>
              {src.detail && <span className="chip-meta">({src.detail})</span>}
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => handleRemoveSource(src.id)}
                aria-label={`Remove source ${src.name}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Capsule */}
      <form onSubmit={handleSubmit} className="composer-form-container">
        <div className="composer-capsule">
          {/* Plus action button with dropdown */}
          <div className="composer-plus-wrapper" ref={menuRef}>
            <button
              type="button"
              className={`composer-btn composer-plus-btn ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Add sources or research context"
              aria-expanded={menuOpen}
              title="Attach research sources (PDF, URL, Text)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>

            {menuOpen && (
              <div className="composer-dropdown-menu" role="menu">
                <div className="dropdown-section-title">ATTACH RESEARCH MATERIAL</div>
                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  <div className="item-text">
                    <span className="item-title">Upload research file</span>
                    <span className="item-desc">PDF, TXT, Markdown (Max 10MB)</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setUrlModalOpen(true)
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <div className="item-text">
                    <span className="item-title">Add reference URL</span>
                    <span className="item-desc">Study link, DOI, or article</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setPasteModalOpen(true)
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                  <div className="item-text">
                    <span className="item-title">Paste text excerpt</span>
                    <span className="item-desc">Raw passage or context notes</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Multiline Hypothesis Textarea */}
          <div className="composer-input-area">
            <textarea
              id={inputId}
              ref={textareaRef}
              className="composer-textarea"
              placeholder={isListening ? 'Listening... Speak your hypothesis now' : placeholder}
              aria-label="Message Contra"
              value={hypothesis}
              onChange={(e) => onHypothesisChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isResearching}
              rows={1}
            />
          </div>

          {/* Right Action Cluster: Microphone & Send Button */}
          <div className="composer-actions-right">
            {/* Microphone Voice Button */}
            <button
              type="button"
              className={`composer-btn composer-mic-btn ${isListening ? 'recording' : ''} ${
                !isSpeechAvailable ? 'unavailable' : ''
              }`}
              onClick={toggleVoiceRecording}
              aria-label={isListening ? 'Stop voice recording' : 'Speak hypothesis via microphone'}
              title={
                !isSpeechAvailable
                  ? 'Voice input unavailable in this browser'
                  : isListening
                  ? 'Stop voice recording (Click to finish)'
                  : 'Speak hypothesis via microphone'
              }
              disabled={isResearching}
            >
              {isListening ? (
                <span className="mic-listening-pulse" aria-hidden="true" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              className="composer-send-btn"
              disabled={!hypothesis.trim() || isResearching}
              aria-label="Send message"
              title="Send message (Enter)"
            >
              {isResearching ? (
                <span className="send-spinner" aria-hidden="true" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* URL Input Modal */}
      {urlModalOpen && (
        <div className="composer-modal-backdrop" onClick={() => setUrlModalOpen(false)}>
          <div className="composer-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="url-modal-title">
            <h3 id="url-modal-title" className="modal-title">Add Reference Website or Study URL</h3>
            <p className="modal-desc">
              Contra will catalog this source as prior context during dialectical evidence cross-examination.
            </p>
            <form onSubmit={handleAddUrl}>
              <input
                type="text"
                className="modal-input"
                placeholder="https://example.com/research-paper"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  setUrlError('')
                }}
                autoFocus
              />
              {urlError && <span className="modal-error">{urlError}</span>}
              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setUrlModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-confirm" disabled={!urlInput.trim()}>
                  Attach URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paste Text Modal */}
      {pasteModalOpen && (
        <div className="composer-modal-backdrop" onClick={() => setPasteModalOpen(false)}>
          <div className="composer-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="paste-modal-title">
            <h3 id="paste-modal-title" className="modal-title">Paste Reference Text or Excerpt</h3>
            <p className="modal-desc">
              Supply relevant excerpts or claim background to incorporate into the assumption autopsy.
            </p>
            <form onSubmit={handleAddPastedText}>
              <input
                type="text"
                className="modal-input"
                placeholder="Title or label (e.g. Study Abstract)"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
              />
              <textarea
                className="modal-textarea"
                placeholder="Paste the excerpt, abstract, or methodology notes here..."
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                rows={5}
                required
              />
              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setPasteModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-confirm" disabled={!pastedContent.trim()}>
                  Attach Excerpt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
