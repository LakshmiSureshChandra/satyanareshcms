'use client'

import { useEffect, useRef, useState } from 'react'

type State = 'idle' | 'playing' | 'paused'

function stripHtml(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// prefer higher-quality bundled voices (iOS/Android/desktop all ship at least
// one "enhanced"/"premium"/"natural" system voice alongside the default one)
function pickVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((v) => /en/i.test(v.lang) && /natural|enhanced|premium/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    voices[0]
  )
}

export function ListenButton({ title, content }: { title: string; content: string }) {
  const [supported, setSupported] = useState(true)
  const [state, setState] = useState<State>('idle')
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) setSupported(false)
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  function play() {
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(`${title}. ${stripHtml(content)}`)
    const voice = pickVoice(window.speechSynthesis.getVoices())
    if (voice) utter.voice = voice
    utter.onend = () => setState('idle')
    utter.onerror = () => setState('idle')
    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
    setState('playing')
  }

  function pause() {
    window.speechSynthesis.pause()
    setState('paused')
  }

  function stop() {
    window.speechSynthesis.cancel()
    setState('idle')
  }

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={state === 'playing' ? pause : play}
        className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
      >
        {state === 'playing' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a9 9 0 0 1 0 12" />
          </svg>
        )}
        {state === 'idle' && 'Listen to this article'}
        {state === 'playing' && 'Pause'}
        {state === 'paused' && 'Resume'}
      </button>
      {state !== 'idle' && (
        <button onClick={stop} aria-label="Stop" className="rounded-md border border-line p-2 text-ink-soft transition-colors hover:border-accent hover:text-accent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" /></svg>
        </button>
      )}
    </div>
  )
}
