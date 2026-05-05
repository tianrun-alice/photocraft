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
    return <div className="text-sm text-emerald-700/85">请选择或上传一张照片</div>
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700/85">当前图片</h2>
          <button type="button" className="pc-btn-danger" onClick={() => removePhoto(photo.id)}>
            删除
          </button>
        </div>
      </section>

      <p className="rounded-md border border-emerald-200/80 bg-emerald-50/60 px-2.5 py-1.5 text-[11px] leading-snug text-emerald-800/90">
        修改 尺寸模板、边框设置、文字批注 会解除已套用预设
      </p>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700/85">尺寸模板</h2>
          <button type="button" className="pc-btn-secondary shrink-0" onClick={rotateTemplate} title="旋转模板">
            旋转 {photo.templateRotation}°
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.name}
              type="button"
              className={[
                'rounded-md border px-1.5 py-2 text-[11px] font-medium transition-colors sm:px-2 sm:text-xs',
                t.name === photo.template.name ? 'pc-selected' : 'border-emerald-200 bg-white hover:bg-emerald-50/60',
              ].join(' ')}
              onClick={() => setTemplate(t)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700/85">边框设置</h2>
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/40 px-2 py-1.5">
          <span className="text-xs text-emerald-800/80">颜色</span>
          <input
            type="color"
            value={photo.borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-emerald-200 bg-white"
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
          <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700/85">文字批注</h2>
          <button type="button" className="pc-btn-primary px-3 py-1.5" onClick={() => addAnnotation()}>
            添加文字
          </button>
        </div>

        <div className="space-y-3">
          {photo.annotations.map((ann) => (
            <div
              key={ann.id}
              className="rounded-md border border-emerald-200 bg-emerald-50/35 p-3 space-y-3 shadow-sm"
            >
              <div className="flex gap-2 items-center min-w-0">
                <input
                  className="pc-input flex-1 min-w-0 py-1.5 px-2"
                  value={ann.text}
                  onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                />
                <button type="button" className="pc-btn-danger shrink-0" onClick={() => removeAnnotation(ann.id)}>
                  删除
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-medium text-emerald-700/85">字号 (mm)</span>
                  <input
                    type="number"
                    className="pc-input w-full py-1.5 px-2"
                    value={ann.fontSize}
                    min={1}
                    step={0.5}
                    onChange={(e) => updateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition-colors',
                    ann.bold
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50/80',
                  ].join(' ')}
                  title="加粗"
                  onClick={() => updateAnnotation(ann.id, { bold: !ann.bold })}
                >
                  B
                </button>
                <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-emerald-700/85">颜色</span>
                <input
                  type="color"
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-emerald-200 bg-white"
                  value={ann.color}
                  onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })}
                />
              </div>

              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-emerald-700/85">背景色</span>
                <input
                  type="color"
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-emerald-200 bg-white"
                  value={ann.background ?? '#ffffff'}
                  onChange={(e) => updateAnnotation(ann.id, { background: e.target.value })}
                />
                <span className="min-w-[4px] flex-1" aria-hidden />
                <button
                  type="button"
                  className="pc-btn-secondary shrink-0 py-1.5 px-2.5 text-[11px]"
                  onClick={() => updateAnnotation(ann.id, { background: null })}
                >
                  清除背景
                </button>
              </div>
            </div>
          ))}

          {photo.annotations.length === 0 && <div className="text-xs text-emerald-700/85">暂无批注</div>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-700/85">图片操作</h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="pc-btn-secondary py-2" onClick={() => rotateImage('left')}>
            左转
          </button>
          <button type="button" className="pc-btn-secondary py-2" onClick={() => rotateImage('right')}>
            右转
          </button>
          <button type="button" className="pc-btn-secondary py-2" onClick={() => flipImage('x')}>
            水平翻转
          </button>
          <button type="button" className="pc-btn-secondary py-2" onClick={() => flipImage('y')}>
            垂直翻转
          </button>
        </div>
      </section>

      <section>
        <button type="button" className="pc-btn-primary w-full" onClick={() => exportCanvas(photo, 'jpeg', 0.95)}>
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
    <div className="grid grid-cols-[minmax(0,38px)_minmax(0,1fr)_46px] items-center gap-1.5 rounded-md border border-emerald-100 bg-white px-1 py-1 sm:grid-cols-[40px_1fr_52px] sm:gap-2">
      <label className="text-xs text-emerald-900/85 flex items-center gap-1.5">
        <input
          type="checkbox"
          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-400"
          checked={props.enabled}
          onChange={(e) => props.onEnabled(e.target.checked)}
        />
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
        className="min-w-0 accent-emerald-600 disabled:opacity-40"
      />
      <input
        type="number"
        className="pc-input w-full px-1.5 py-1 text-center"
        value={props.value}
        min={0}
        step={0.5}
        onChange={(e) => props.onValue(Number(e.target.value))}
        disabled={!props.enabled}
      />
    </div>
  )
}
