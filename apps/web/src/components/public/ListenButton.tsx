'use client'

import { useEffect, useRef, useState } from 'react'

type State = 'idle' | 'playing' | 'paused'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

function stripHtml(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// speechSynthesis.getVoices() is frequently empty on the first call — the list
// loads asynchronously and fires 'voiceschanged' once ready (some browsers,
// notably Safari, never fire it and just have voices available immediately).
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices()
    if (existing.length) return resolve(existing)
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
    // fallback in case the event never fires
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500)
  })
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

// Split into sentence-ish chunks and speak as a queue, all pinned to the same
// voice — one giant utterance is unreliable across browsers (silent cutoffs,
// and some engines re-pick a voice partway through a very long single call,
// which is what produced the "multiple voices" effect).
function splitIntoChunks(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+|\s*$/g)?.filter((s) => s.trim()) || [text]
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + s).length > 200) {
      if (current) chunks.push(current.trim())
      current = s
    } else {
      current += s
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export function ListenButton({ slug, title, content }: { slug: string; title: string; content: string }) {
  const [supported, setSupported] = useState(true)
  const [state, setState] = useState<State>('idle')
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined)
  const queueRef = useRef<string[]>([])
  // Cancelling an in-progress utterance fires ITS OWN onend — a stale callback
  // that must never be allowed to keep talking. Each play() bumps this counter
  // and closes over the new value, so any earlier utterance's onend/onerror
  // (however it fires) is checked against the current generation and becomes a
  // no-op once superseded, instead of racing a second speech chain in parallel
  // (which is what produced two overlapping voices at once).
  const genRef = useRef(0)

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false)
      return
    }
    loadVoices().then((voices) => { voiceRef.current = pickVoice(voices) })
    return () => {
      genRef.current++
      window.speechSynthesis.cancel()
    }
  }, [])

  function speakNext(gen: number) {
    if (gen !== genRef.current) return
    const text = queueRef.current.shift()
    if (!text) {
      setState('idle')
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    if (voiceRef.current) utter.voice = voiceRef.current
    // A single utterance can fire BOTH onend and onerror (an interrupted one
    // errors then ends; some engines double-fire). Without this latch each
    // firing would call speakNext again, spawning parallel chains that shift
    // different chunks off the shared queue and speak them at once — two
    // overlapping voices. The latch guarantees one advance per utterance.
    let advanced = false
    const advance = () => {
      if (advanced) return
      advanced = true
      speakNext(gen)
    }
    utter.onend = advance
    utter.onerror = advance
    window.speechSynthesis.speak(utter)
  }

  // Chrome's cancel() does not synchronously stop the previous utterance — its
  // audio backend can keep producing sound for a variable, unbounded amount of
  // time afterward (Safari's implementation happens to be effectively
  // synchronous, which is why this only showed up in Chrome). A fixed delay
  // before the next speak() is therefore a guess that can lose the race under
  // load; poll until the engine actually reports idle instead.
  function waitUntilIdleThenSpeak(gen: number, attempt = 0) {
    if (gen !== genRef.current) return
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      if (attempt > 40) { speakNext(gen); return } // ~2s cap — don't wait forever
      setTimeout(() => waitUntilIdleThenSpeak(gen, attempt + 1), 50)
      return
    }
    speakNext(gen)
  }

  function play() {
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
      return
    }
    const gen = ++genRef.current
    queueRef.current = splitIntoChunks(`${title}. ${stripHtml(content)}`)
    window.speechSynthesis.cancel()
    setState('playing')
    waitUntilIdleThenSpeak(gen)
    fetch(`${API}/api/posts/${slug}/audio-play`, { method: 'POST' }).catch(() => {})
  }

  function pause() {
    window.speechSynthesis.pause()
    setState('paused')
  }

  function stop() {
    genRef.current++
    queueRef.current = []
    window.speechSynthesis.cancel()
    setState('idle')
  }

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={state === 'playing' ? pause : play}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
      >
        {state === 'playing' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a9 9 0 0 1 0 12" />
          </svg>
        )}
        {state === 'idle' && 'Listen to this article'}
        {state === 'playing' && 'Pause'}
        {state === 'paused' && 'Resume'}
      </button>
      {state !== 'idle' && (
        <button onClick={stop} aria-label="Stop" className="rounded-md border border-line p-2.5 text-ink-soft transition-colors hover:border-accent hover:text-accent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" /></svg>
        </button>
      )}
    </div>
  )
}
