'use client'

import { useEffect, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { adminApi } from '@/lib/admin-api'

type Ref = { id: number; title?: string; name?: string }
type Node = { title: string; type: string; url?: string | null; refId?: number | null; newWindow?: boolean; children?: Node[] }
// flat editing model: depth 0-2 (3 levels), rebuilt into a tree on save
type Item = { key: number; title: string; type: string; url: string; refId: number | null; newWindow: boolean; depth: number }

let nextKey = 1

function flatten(nodes: Node[], depth = 0): Item[] {
  return nodes.flatMap((n) => [
    { key: nextKey++, title: n.title, type: n.type, url: n.url || '', refId: n.refId ?? null, newWindow: !!n.newWindow, depth },
    ...flatten(n.children || [], depth + 1),
  ])
}

function toTree(items: Item[]): Node[] {
  const root: Node[] = []
  const stack: { node: Node; depth: number }[] = []
  for (const it of items) {
    const node: Node = { title: it.title, type: it.type, url: it.url || null, refId: it.refId, newWindow: it.newWindow, children: [] }
    while (stack.length && stack[stack.length - 1].depth >= it.depth) stack.pop()
    if (!stack.length) root.push(node)
    else stack[stack.length - 1].node.children!.push(node)
    stack.push({ node, depth: it.depth })
  }
  return root
}

function SortableRow({
  item, onIndent, onRemove, canIndent, editing, onToggleEdit, onChange,
}: {
  item: Item
  onIndent: (key: number, dir: 1 | -1) => void
  onRemove: (key: number) => void
  canIndent: boolean
  editing: boolean
  onToggleEdit: (key: number | null) => void
  onChange: (key: number, patch: Partial<Item>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, marginLeft: item.depth * 28 }}
      className={`mb-1.5 rounded-md border border-stone-200 bg-white ${isDragging ? 'z-10 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button {...attributes} {...listeners} className="cursor-grab text-stone-400 hover:text-stone-700" aria-label="Drag">⠿</button>
        <span className="text-sm font-medium">{item.title}</span>
        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] uppercase text-stone-500">{item.type}</span>
        {item.newWindow && <span className="text-[10px] text-stone-400">↗ new tab</span>}
        <span className="ml-auto flex items-center gap-1 text-stone-400">
          <button onClick={() => onToggleEdit(editing ? null : item.key)} className={`rounded px-2 text-xs font-semibold hover:bg-stone-100 ${editing ? 'text-stone-900' : 'text-stone-500'}`} title="Edit">Edit</button>
          <button onClick={() => onIndent(item.key, -1)} disabled={item.depth === 0} className="rounded px-1.5 hover:bg-stone-100 disabled:opacity-30" title="Outdent">←</button>
          <button onClick={() => onIndent(item.key, 1)} disabled={!canIndent} className="rounded px-1.5 hover:bg-stone-100 disabled:opacity-30" title="Indent">→</button>
          <button onClick={() => onRemove(item.key)} className="rounded px-1.5 text-red-500 hover:bg-red-50" title="Remove">✕</button>
        </span>
      </div>

      {editing && (
        <div className="space-y-2.5 border-t border-stone-100 bg-stone-50 px-3 py-3">
          <div>
            <label className="admin-label">Label</label>
            <input value={item.title} onChange={(e) => onChange(item.key, { title: e.target.value })} className="admin-input" />
          </div>
          {item.type === 'custom' && (
            <>
              <div>
                <label className="admin-label">URL</label>
                <input value={item.url} onChange={(e) => onChange(item.key, { url: e.target.value })} placeholder="/contact or https://…" className="admin-input" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={item.newWindow} onChange={(e) => onChange(item.key, { newWindow: e.target.checked })} className="h-4 w-4 accent-stone-900" />
                Open in new tab
              </label>
            </>
          )}
          <button onClick={() => onToggleEdit(null)} className="rounded-md bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-700">Done</button>
        </div>
      )}
    </div>
  )
}

// Drag-drop builder used for both the header menu and the footer columns.
// location = 'header' | 'footer'. In the footer, top-level items are column
// headings and their nested children become the links under each column.
export function MenuBuilder({
  location = 'header',
  title = 'Menus',
  saveLabel = 'Save Menu',
  hint = 'Drag ⠿ to reorder · use ← → to nest (up to 3 levels) · remember to Save',
}: {
  location?: 'header' | 'footer'
  title?: string
  saveLabel?: string
  hint?: string
}) {
  const [items, setItems] = useState<Item[]>([])
  const [sources, setSources] = useState<{ posts: Ref[]; pages: Ref[]; categories: Ref[] }>({ posts: [], pages: [], categories: [] })
  const [form, setForm] = useState({ title: '', type: 'custom', url: '', refId: '', newWindow: false })
  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  // 'loading' | 'ready' | 'error' — Save is only allowed once the real data has
  // loaded, so a network blip can never look like "empty" and get saved over
  // the actual menu/footer.
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const q = `?location=${location}`
  const updateItem = (key: number, patch: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)))

  function load() {
    setStatus('loading')
    adminApi(`/admin/menus${q}`)
      .then((data: any) => {
        setItems(flatten(data.tree))
        setSources({ posts: data.posts, pages: data.pages, categories: data.categories })
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(load, [q])

  function addItem(e: React.FormEvent) {
    e.preventDefault()
    const refList = form.type === 'category' ? sources.categories : form.type === 'page' ? sources.pages : sources.posts
    const ref = refList.find((r) => r.id === Number(form.refId))
    const label = form.title || ref?.title || ref?.name || ''
    if (!label) return
    setItems([
      ...items,
      {
        key: nextKey++,
        title: label,
        type: form.type,
        url: form.type === 'custom' ? form.url : '',
        refId: form.type === 'custom' ? null : Number(form.refId) || null,
        newWindow: form.type === 'custom' && form.newWindow,
        depth: 0,
      },
    ])
    setForm({ title: '', type: form.type, url: '', refId: '', newWindow: false })
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setItems((list) => {
      const from = list.findIndex((i) => i.key === active.id)
      const to = list.findIndex((i) => i.key === over.id)
      const moved = arrayMove(list, from, to)
      return moved.map((it, idx) => ({
        ...it,
        depth: idx === 0 ? 0 : Math.min(it.depth, moved[idx - 1].depth + 1, 2),
      }))
    })
  }

  function indent(key: number, dir: 1 | -1) {
    setItems((list) =>
      list.map((it, idx) => {
        if (it.key !== key) return it
        const maxDepth = idx === 0 ? 0 : Math.min(list[idx - 1].depth + 1, 2)
        return { ...it, depth: Math.max(0, Math.min(it.depth + dir, maxDepth)) }
      })
    )
  }

  async function save() {
    setBusy(true)
    await adminApi(`/admin/menus${q}`, { method: 'PUT', body: { tree: toTree(items) } })
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const refList = form.type === 'category' ? sources.categories : form.type === 'page' ? sources.pages : sources.posts
  const addBtnLabel = location === 'footer' ? '+ Add to footer' : '+ Add to menu'
  const addTitle = location === 'footer' ? 'Add Footer Item' : 'Add Menu Item'
  const emptyMsg = location === 'footer' ? 'Footer is empty — add columns and links from the left.' : 'Menu is empty — add items from the left.'

  if (status === 'loading') {
    return <p className="text-sm text-stone-500">Loading…</p>
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-semibold text-red-800">Couldn&apos;t load {title.toLowerCase()}.</p>
        <p className="mt-1 text-sm text-red-700">
          This is a network or server problem — nothing has been changed. Saving is disabled until this loads
          successfully, so your existing {location === 'footer' ? 'footer' : 'menu'} is safe.
        </p>
        <button onClick={load} className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-700">Saved ✓</span>}
          <button onClick={save} disabled={busy} className="rounded-md bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50">
            {busy ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>

      {location === 'footer' && (
        <p className="mb-4 rounded-md bg-stone-100 px-4 py-2.5 text-xs text-stone-600">
          Top-level items become footer <b>column headings</b>. Indent items beneath a heading (→) to make them the <b>links</b> in that column.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={addItem} className="h-fit space-y-3 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold">{addTitle}</h2>
          <div>
            <label className="admin-label">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, refId: '' })} className="admin-input">
              <option value="custom">Custom Link{location === 'footer' ? ' / Heading' : ''}</option>
              {location !== 'footer' && <option value="category">Category</option>}
              <option value="page">Page</option>
              {location !== 'footer' && <option value="post">Post</option>}
            </select>
          </div>
          {form.type === 'custom' ? (
            <>
              <div>
                <label className="admin-label">{location === 'footer' ? 'Label / heading text' : 'Title'}</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="admin-input" />
              </div>
              <div>
                <label className="admin-label">URL {location === 'footer' && <span className="font-normal text-stone-400">(use # for a plain heading)</span>}</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="/contact, https://…, or #" className="admin-input" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.newWindow} onChange={(e) => setForm({ ...form, newWindow: e.target.checked })} className="h-4 w-4 accent-stone-900" />
                Open in new tab
              </label>
            </>
          ) : (
            <>
              <div>
                <label className="admin-label">Select {form.type}</label>
                <select value={form.refId} onChange={(e) => setForm({ ...form, refId: e.target.value })} required className="admin-input">
                  <option value="">— choose —</option>
                  {refList.map((r) => <option key={r.id} value={r.id}>{r.title || r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Label <span className="font-normal text-stone-400">(optional override)</span></label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" />
              </div>
            </>
          )}
          <button className="w-full rounded-md border border-stone-300 py-2 text-sm font-semibold hover:bg-stone-100">{addBtnLabel}</button>
        </form>

        <div className="lg:col-span-2">
          <p className="mb-3 text-xs text-stone-500">{hint}</p>
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
              {items.map((it, idx) => (
                <SortableRow
                  key={it.key}
                  item={it}
                  onIndent={indent}
                  onRemove={(key) => { setItems(items.filter((i) => i.key !== key)); if (editingKey === key) setEditingKey(null) }}
                  canIndent={idx > 0 && it.depth < Math.min(items[idx - 1].depth + 1, 2)}
                  editing={editingKey === it.key}
                  onToggleEdit={setEditingKey}
                  onChange={updateItem}
                />
              ))}
            </SortableContext>
          </DndContext>
          {!items.length && <p className="rounded-xl border border-dashed border-stone-300 py-10 text-center text-sm text-stone-400">{emptyMsg}</p>}
        </div>
      </div>
    </div>
  )
}
