import { useMemo, useState } from 'react'
import type { PresetTemplate } from '@photocraft/shared'
import { useEditorStore } from '@/store/editorStore'
import { photoMatchesPreset } from '@/utils/presetMatch'

function summarizePresetBorder(b: PresetTemplate['border']): string {
  const parts: string[] = []
  if (b.enabled.top) parts.push(`上${b.top}`)
  if (b.enabled.bottom) parts.push(`下${b.bottom}`)
  if (b.enabled.left) parts.push(`左${b.left}`)
  if (b.enabled.right) parts.push(`右${b.right}`)
  return parts.length ? parts.join('·') : '无边框'
}

function presetDetailLines(p: PresetTemplate): { line1: string; line2: string } {
  const borderStr = summarizePresetBorder(p.border)
  const line1 = `${p.templateName} · 旋转 ${p.templateRotation}° · 边框色 ${p.borderColor}`
  const line2 = `${borderStr} · 字号 ${p.fontSize}mm · 字色 ${p.fontColor}`
  return { line1, line2 }
}

export function PresetPanel() {
  const [open, setOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  const presets = useEditorStore((s) => s.presets)
  const selectedPresetId = useEditorStore((s) => s.selectedPresetId)
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  const photo = useEditorStore((s) => s.photos.find((p) => p.id === s.selectedPhotoId) ?? null)
  const selectPreset = useEditorStore((s) => s.selectPreset)
  const applyPresetToPhoto = useEditorStore((s) => s.applyPresetToPhoto)
  const saveCurrentAsPreset = useEditorStore((s) => s.saveCurrentAsPreset)
  const removePreset = useEditorStore((s) => s.removePreset)

  const builtinOrder = useMemo(() => ['4寸', '5寸', '6寸'], [])
  const builtins = useMemo(
    () =>
      presets
        .filter((p) => p.builtin)
        .sort((a, b) => builtinOrder.indexOf(a.templateName) - builtinOrder.indexOf(b.templateName)),
    [presets, builtinOrder],
  )
  const userPresets = useMemo(() => presets.filter((p) => !p.builtin), [presets])

  const anchoredPreset = useMemo(() => {
    if (!photo?.appliedPresetId) return null
    return presets.find((p) => p.id === photo.appliedPresetId) ?? null
  }, [photo, presets])

  const anchoredMatches = Boolean(
    photo && anchoredPreset && photoMatchesPreset(photo, anchoredPreset),
  )

  const presetHelpLines = useMemo(() => {
    const lines = [
      '新上传的照片为「不使用预设」。在列表中点选某条预设后会应用到当前照片。',
      '若手动修改了尺寸模板、旋转、边框、边框颜色，或批注的字号、颜色、加粗、背景，将自动切回「不使用预设」。',
      '使用「保存当前设置」生成的新预设后，会自动锚定到新预设。',
    ]
    if (photo && anchoredPreset && anchoredMatches) {
      lines.push(`当前照片与「${anchoredPreset.name}」一致。`)
    }
    return lines
  }, [photo, anchoredPreset, anchoredMatches])

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function choose(id: string | null) {
    selectPreset(id)
    if (selectedPhotoId) applyPresetToPhoto()
  }

  function onSave() {
    const n = name.trim()
    if (!n) return
    saveCurrentAsPreset(n)
    setName('')
    setSaving(false)
    if (!open) setOpen(true)
  }

  function presetCard(
    p: PresetTemplate,
    opts: { showDelete?: boolean },
  ) {
    const expanded = expandedIds.has(p.id)
    const { line1, line2 } = presetDetailLines(p)
    const selected = selectedPresetId === p.id

    return (
      <div
        key={p.id}
        className={[
          'rounded-md border transition-colors',
          selected ? 'pc-selected border-emerald-500' : 'border-emerald-200 bg-white',
        ].join(' ')}
      >
        <div className="flex gap-1 p-1.5">
          <button
            type="button"
            className="min-w-0 flex-1 rounded px-2 py-1.5 text-left text-xs hover:bg-emerald-50/60"
            onClick={() => choose(p.id)}
            title={expanded ? undefined : `${line1} · ${line2}`}
          >
            <div className="font-medium text-emerald-950 truncate">{p.name}</div>
          </button>
          <button
            type="button"
            className="pc-btn-secondary shrink-0 px-2 py-1 text-[10px]"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleExpanded(p.id)
            }}
          >
            {expanded ? '收起' : '详情'}
          </button>
          {opts.showDelete && (
            <button
              type="button"
              className="pc-btn-secondary shrink-0 px-2.5 text-emerald-800/70 hover:text-red-600"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removePreset(p.id)
              }}
              title="删除预设"
            >
              ×
            </button>
          )}
        </div>
        {expanded && (
          <div className="space-y-0.5 border-t border-emerald-100 px-3 py-2 text-[11px] leading-snug text-emerald-800/85">
            <div>{line1}</div>
            <div>{line2}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex w-full items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800/85">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate">预设模板</span>
          <div className="group relative inline-flex shrink-0">
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100/90 text-[10px] font-semibold leading-none text-emerald-800 shadow-sm normal-case ring-emerald-200/60 transition hover:border-emerald-400 hover:from-emerald-100 hover:to-emerald-100 hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              aria-label="预设套用说明（悬停或聚焦查看）"
            >
              ?
            </button>
            <div
              className="pointer-events-none invisible absolute left-0 top-full z-[60] w-[min(17rem,calc(100vw-2rem))] translate-y-0 pt-1 opacity-0 transition duration-150 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
              role="tooltip"
            >
              <div className="rounded-lg border border-emerald-200/95 bg-white px-3 py-2.5 shadow-lg shadow-emerald-900/[0.08] ring-1 ring-emerald-100/90">
                <div className="border-b border-emerald-100 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90">
                  预设说明
                </div>
                <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-emerald-900/88">
                  {presetHelpLines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 font-normal normal-case text-emerald-600/90 hover:text-emerald-800"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '收起' : '展开'}
        </button>
      </div>

      {open && (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <button
              type="button"
              className={[
                'w-full rounded-md border px-2.5 py-2 text-left text-xs transition-colors',
                selectedPresetId === null ? 'pc-selected border-emerald-500' : 'border-emerald-200 bg-white hover:bg-emerald-50/70',
              ].join(' ')}
              onClick={() => choose(null)}
            >
              <div className="font-medium text-emerald-950">不使用预设</div>
            </button>

            {builtins.map((p) => presetCard(p, {}))}
            {userPresets.map((p) => presetCard(p, { showDelete: true }))}
          </div>

          {!saving ? (
            <button
              type="button"
              className="pc-btn-primary w-full"
              onClick={() => setSaving(true)}
              disabled={!selectedPhotoId}
              title={!selectedPhotoId ? '先上传并选中一张照片' : '保存当前照片设置为预设'}
            >
              保存当前设置
            </button>
          ) : (
            <div className="space-y-2">
              <input
                className="pc-input w-full py-2 px-2"
                placeholder="预设名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSave()
                  if (e.key === 'Escape') {
                    setSaving(false)
                    setName('')
                  }
                }}
              />
              <div className="flex gap-2">
                <button type="button" className="pc-btn-primary flex-1" onClick={onSave}>
                  保存
                </button>
                <button
                  type="button"
                  className="pc-btn-secondary flex-1"
                  onClick={() => {
                    setSaving(false)
                    setName('')
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
