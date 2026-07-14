'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { uploadImage, apiOrigin } from '@/lib/admin-api'
import { useRef } from 'react'

export function Editor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return <div className="h-[480px] rounded-md border border-stone-300 bg-white" />

  async function insertImage(file: File) {
    const { url } = await uploadImage(file)
    editor!.chain().focus().setImage({ src: `${apiOrigin}${url}` }).run()
  }

  const btn = (active: boolean) =>
    `rounded px-2 py-1 text-sm font-medium ${active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200'}`

  return (
    <div className="rounded-md border border-stone-300 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-200 p-1.5">
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" className={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
        <span className="mx-1 h-5 w-px bg-stone-200" />
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <span className="mx-1 h-5 w-px bg-stone-200" />
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</button>
        <span className="mx-1 h-5 w-px bg-stone-200" />
        <button
          type="button"
          className={btn(editor.isActive('link'))}
          onClick={() => {
            const prev = editor.getAttributes('link').href
            const url = window.prompt('Link URL', prev || 'https://')
            if (url === null) return
            if (url === '') editor.chain().focus().unsetLink().run()
            else editor.chain().focus().setLink({ href: url }).run()
          }}
        >
          🔗 Link
        </button>
        <button type="button" className={btn(false)} onClick={() => fileRef.current?.click()}>🖼 Image</button>
        <button
          type="button"
          className={btn(false)}
          onClick={() => {
            const url = window.prompt('YouTube URL')
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
          }}
        >
          ▶ YouTube
        </button>
        <span className="mx-1 h-5 w-px bg-stone-200" />
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()}>↺</button>
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()}>↻</button>
      </div>
      <EditorContent editor={editor} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) insertImage(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
