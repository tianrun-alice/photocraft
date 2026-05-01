import { useMemo } from 'react'
import { PHOTO_TEMPLATES } from '@photocraft/shared'
import { useEditorStore } from '@/store/editorStore'
import { exportCanvas } from '@/utils/exportCanvas'

export function ControlPanel() {
  const photo = useEditorStore((s) => s.photos.find((p) => p.id === s.selectedPhotoId) ?? null)
  const removePhoto = useEditorStore((s) => s.removePhoto)
  const setTemplate = useEditorStore((s) => s.setTemplate)
  const rotateTemplate = useEditorStore((s) => s.rotateTemplate)
  const setBorder = useEditorStore((s) => s.setBorder)
  const setBorderColor = useEditorStore((s) => s.setBorderColor)
  const addAnnotation = useEditorStore((s) => s.addAnnotation)
  const updateAnnotation = useEditorStore((s) => s.updateAnnotation)
  const removeAnnotation = useEditorStore((s) => s.removeAnnotation)
  const rotateImage = useEditorStore((s) => s.rotateImage)
  const flipImage = useEditorStore((s) => s.flipImage)

  const templates = useMemo(() => PHOTO_TEMPLATES, [])

  if (!photo) {
    return <div className="text-sm text-gray-500">请选择或上传一张照片</div>
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">当前图片</h2>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-red-600"
            onClick={() => removePhoto(photo.id)}
          >
            删除
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">尺寸模板</h2>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
            onClick={rotateTemplate}
            title="旋转模板"
          >
            旋转 {photo.templateRotation}°
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {templates.map((t) => (
            <button
              key={t.name}
              type="button"
              className={[
                'text-xs px-2 py-2 rounded border',
                t.name === photo.template.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50',
              ].join(' ')}
              onClick={() => setTemplate(t)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">边框设置</h2>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">颜色</div>
          <input
            type="color"
            value={photo.borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="h-7 w-10 border rounded"
          />
        </div>

        <BorderRow
          label="上"
          enabled={photo.border.enabled.top}
          value={photo.border.top}
          onEnabled={(v) => setBorder({ enabled: { top: v } })}
          onValue={(v) => setBorder({ top: v })}
        />
        <BorderRow
          label="下"
          enabled={photo.border.enabled.bottom}
          value={photo.border.bottom}
          onEnabled={(v) => setBorder({ enabled: { bottom: v } })}
          onValue={(v) => setBorder({ bottom: v })}
        />
        <BorderRow
          label="左"
          enabled={photo.border.enabled.left}
          value={photo.border.left}
          onEnabled={(v) => setBorder({ enabled: { left: v } })}
          onValue={(v) => setBorder({ left: v })}
        />
        <BorderRow
          label="右"
          enabled={photo.border.enabled.right}
          value={photo.border.right}
          onEnabled={(v) => setBorder({ enabled: { right: v } })}
          onValue={(v) => setBorder({ right: v })}
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">文字批注</h2>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-gray-900 text-white hover:bg-gray-800"
            onClick={() => addAnnotation()}
          >
            添加文字
          </button>
        </div>

        <div className="space-y-2">
          {photo.annotations.map((ann) => (
            <div key={ann.id} className="border border-gray-200 rounded p-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 text-xs border rounded px-2 py-1"
                  value={ann.text}
                  onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                />
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-red-600"
                  onClick={() => removeAnnotation(ann.id)}
                >
                  删除
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-xs text-gray-600 flex items-center justify-between gap-2">
                  字号(mm)
                  <input
                    type="number"
                    className="w-20 text-xs border rounded px-2 py-1"
                    value={ann.fontSize}
                    min={1}
                    step={0.5}
                    onChange={(e) => updateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-gray-600 flex items-center justify-between gap-2">
                  颜色
                  <input
                    type="color"
                    className="h-7 w-10 border rounded"
                    value={ann.color}
                    onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className={[
                    'text-xs px-2 py-1 rounded border',
                    ann.bold ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:bg-gray-50',
                  ].join(' ')}
                  onClick={() => updateAnnotation(ann.id, { bold: !ann.bold })}
                >
                  B
                </button>
                <label className="text-xs text-gray-600 flex items-center justify-between gap-2">
                  背景
                  <input
                    type="color"
                    className="h-7 w-10 border rounded"
                    value={ann.background ?? '#ffffff'}
                    onChange={(e) => updateAnnotation(ann.id, { background: e.target.value })}
                  />
                </label>
              </div>
              <button
                type="button"
                className="text-[11px] text-gray-500 underline"
                onClick={() => updateAnnotation(ann.id, { background: null })}
              >
                清除背景
              </button>
            </div>
          ))}

          {photo.annotations.length === 0 && <div className="text-xs text-gray-500">暂无批注</div>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">图片操作</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="text-xs px-2 py-2 rounded border border-gray-200 hover:bg-gray-50"
            onClick={() => rotateImage('left')}
          >
            左转
          </button>
          <button
            type="button"
            className="text-xs px-2 py-2 rounded border border-gray-200 hover:bg-gray-50"
            onClick={() => rotateImage('right')}
          >
            右转
          </button>
          <button
            type="button"
            className="text-xs px-2 py-2 rounded border border-gray-200 hover:bg-gray-50"
            onClick={() => flipImage('x')}
          >
            水平翻转
          </button>
          <button
            type="button"
            className="text-xs px-2 py-2 rounded border border-gray-200 hover:bg-gray-50"
            onClick={() => flipImage('y')}
          >
            垂直翻转
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <button
          type="button"
          className="w-full text-sm px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => exportCanvas(photo, 'jpeg', 0.95)}
        >
          导出 JPEG（300DPI）
        </button>
      </section>
    </div>
  )
}

function BorderRow(props: {
  label: string
  enabled: boolean
  value: number
  onEnabled: (v: boolean) => void
  onValue: (v: number) => void
}) {
  return (
    <div className="grid grid-cols-[40px_1fr_52px] gap-2 items-center">
      <label className="text-xs text-gray-600 flex items-center gap-1">
        <input type="checkbox" checked={props.enabled} onChange={(e) => props.onEnabled(e.target.checked)} />
        {props.label}
      </label>
      <input
        type="range"
        min={0}
        max={30}
        step={0.5}
        value={props.value}
        onChange={(e) => props.onValue(Number(e.target.value))}
        disabled={!props.enabled}
      />
      <input
        type="number"
        className="text-xs border rounded px-2 py-1"
        value={props.value}
        min={0}
        step={0.5}
        onChange={(e) => props.onValue(Number(e.target.value))}
        disabled={!props.enabled}
      />
    </div>
  )
}

