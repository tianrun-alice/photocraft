import { useMemo, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'

export function PresetPanel() {
  const [open, setOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  const presets = useEditorStore((s) => s.presets)
  const selectedPresetId = useEditorStore((s) => s.selectedPresetId)
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  const selectPreset = useEditorStore((s) => s.selectPreset)
  const applyPresetToPhoto = useEditorStore((s) => s.applyPresetToPhoto)
  const saveCurrentAsPreset = useEditorStore((s) => s.saveCurrentAsPreset)
  const removePreset = useEditorStore((s) => s.removePreset)

  const list = useMemo(() => presets, [presets])

  function choose(id: string | null) {
    selectPreset(id)
    if (selectedPhotoId) applyPresetToPhoto()
  }

  function onSave() {
    const n = name.trim()
    if (!n) return
    saveCurrentAsPreset(n)
    if (selectedPhotoId) applyPresetToPhoto()
    setName('')
    setSaving(false)
    if (!open) setOpen(true)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700"
        onClick={() => setOpen((v) => !v)}
      >
        <span>预设模板</span>
        <span className="text-xs text-gray-400">{open ? '收起' : '展开'}</span>
      </button>

      {open && (
        <div className="space-y-2">
          <div className="space-y-1">
            <button
              type="button"
              className={[
                'w-full text-left text-xs px-2 py-1 rounded border',
                selectedPresetId === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white',
              ].join(' ')}
              onClick={() => choose(null)}
            >
              默认
            </button>

            {list.map((p) => (
              <div key={p.id} className="flex gap-1">
                <button
                  type="button"
                  className={[
                    'flex-1 text-left text-xs px-2 py-1 rounded border',
                    selectedPresetId === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white',
                  ].join(' ')}
                  onClick={() => choose(p.id)}
                  title={`底边 ${p.border.bottom}mm / 字号 ${p.fontSize}mm`}
                >
                  <div className="font-medium text-gray-800 truncate">{p.name}</div>
                  <div className="text-[11px] text-gray-500 truncate">
                    底边 {p.border.enabled.bottom ? `${p.border.bottom}mm` : '无'} · 字号 {p.fontSize}mm
                  </div>
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200"
                  onClick={() => removePreset(p.id)}
                  title="删除预设"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {!saving ? (
            <button
              type="button"
              className="w-full text-xs px-2 py-1 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300"
              onClick={() => setSaving(true)}
              disabled={!selectedPhotoId}
              title={!selectedPhotoId ? '先上传并选中一张照片' : '保存当前照片设置为预设'}
            >
              保存当前设置
            </button>
          ) : (
            <div className="space-y-1">
              <input
                className="w-full text-xs border rounded px-2 py-1"
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
                <button
                  type="button"
                  className="flex-1 text-xs px-2 py-1 rounded bg-gray-900 text-white hover:bg-gray-800"
                  onClick={onSave}
                >
                  保存
                </button>
                <button
                  type="button"
                  className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
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

