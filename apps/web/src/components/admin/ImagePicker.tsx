'use client'

import { useState } from 'react'
import { uploadImage, apiOrigin } from '@/lib/admin-api'

// Uploads immediately on select, hands back the /uploads/... path.
export function ImagePicker({
  label = 'Banner Image',
  value,
  onChange,
}: {
  label?: string
  value: string | null
  onChange: (path: string | null) => void
}) {
  const [busy, setBusy] = useState(false)

  return (
    <div>
      <label className="admin-label">{label}</label>
      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.startsWith('http') ? value : `${apiOrigin}${value}`} alt="" className="w-full rounded-md border border-stone-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white hover:bg-black/80"
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500 hover:border-stone-400">
          {busy ? 'Uploading…' : '+ Upload image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setBusy(true)
              try {
                const { url } = await uploadImage(f)
                onChange(url)
              } finally {
                setBusy(false)
                e.target.value = ''
              }
            }}
          />
        </label>
      )}
    </div>
  )
}
