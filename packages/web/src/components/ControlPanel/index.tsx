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
    return <div className="text-[11px] text-emerald-700/85 lg:text-sm">请选择或上传一张照片</div>
  }

  return (
    <div className="space-y-1.5 sm:space-y-2.5 lg:space-y-5">
      <section className="space-y-1.5 lg:space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/85 sm:text-xs lg:text-xs">
            当前图片
          </h2>
          <button
            type="button"
            className="pc-btn-danger max-lg:px-2 max-lg:py-1 max-lg:text-[10px]"
            onClick={() => removePhoto(photo.id)}
          >
            删除
          </button>
        </div>
      </section>

      <p className="rounded-md border border-emerald-200/80 bg-emerald-50/60 px-1.5 py-0.5 text-[10px] leading-snug text-emerald-800/90 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
        修改 尺寸模板、边框设置、文字批注 会解除已套用预设
      </p>

      <section className="space-y-1.5 lg:space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/85 sm:text-xs">尺寸模板</h2>
          <button
            type="button"
            className="pc-btn-secondary max-lg:px-2 max-lg:py-1 max-lg:text-[10px] shrink-0 sm:text-xs"
            onClick={rotateTemplate}
            title="旋转模板"
          >
            旋转 {photo.templateRotation}°
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {templates.map((t) => (
            <button
              key={t.name}
              type="button"
              className={[
                'min-w-0 truncate rounded-md border px-0.5 py-1 text-[10px] font-medium transition-colors sm:px-1.5 sm:py-1.5 sm:text-[11px] lg:px-2 lg:py-2 lg:text-xs',
                t.name === photo.template.name ? 'pc-selected' : 'border-emerald-200 bg-white hover:bg-emerald-50/60',
              ].join(' ')}
              onClick={() => setTemplate(t)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-1.5 lg:space-y-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/85 sm:text-xs">边框设置</h2>
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/40 px-1.5 py-1 sm:px-2 sm:py-1.5">
          <span className="text-[10px] text-emerald-800/80 sm:text-xs">颜色</span>
          <input
            type="color"
            value={photo.borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-emerald-200 bg-white sm:h-8 sm:w-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-1 sm:gap-1.5 lg:grid-cols-1 lg:gap-1.5">
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
        </div>
      </section>

      <section className="space-y-1.5 lg:space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/85 sm:text-xs">文字批注</h2>
          <button
            type="button"
            className="pc-btn-primary max-lg:px-2 max-lg:py-1 max-lg:text-[10px] px-3 py-1.5 sm:text-xs"
            onClick={() => addAnnotation()}
          >
            添加文字
          </button>
        </div>

        <div className="space-y-1.5 sm:space-y-2.5">
          {photo.annotations.map((ann) => (
            <div
              key={ann.id}
              className="space-y-1.5 rounded-md border border-emerald-200 bg-emerald-50/35 p-1.5 shadow-sm sm:space-y-2.5 sm:p-2.5 lg:space-y-3 lg:p-3"
            >
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <input
                  className="pc-input min-w-0 flex-1 px-1.5 py-1 text-[11px] sm:px-2 sm:py-1.5 sm:text-xs"
                  value={ann.text}
                  onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                />
                <button
                  type="button"
                  className="pc-btn-danger max-lg:px-2 max-lg:py-1 max-lg:text-[10px] shrink-0"
                  onClick={() => removeAnnotation(ann.id)}
                >
                  删除
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-1 sm:gap-1.5 max-lg:flex-nowrap max-lg:items-center lg:gap-2">
                <div className="flex min-w-0 flex-col gap-0.5 max-lg:max-w-[4.5rem] max-lg:shrink-0 lg:flex-1">
                  <span className="text-[10px] font-medium text-emerald-700/85 max-lg:sr-only sm:text-[11px]">
                    字号 (mm)
                  </span>
                  <input
                    type="number"
                    title="字号 (mm)"
                    aria-label="字号 (mm)"
                    className="pc-input w-full px-1 py-1 text-[11px] max-lg:tabular-nums sm:px-2 sm:py-1.5 sm:text-xs"
                    value={ann.fontSize}
                    min={1}
                    step={0.5}
                    onChange={(e) => updateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors sm:h-8 sm:w-8 sm:text-xs lg:h-9 lg:w-9 lg:text-sm',
                    ann.bold
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50/80',
                  ].join(' ')}
                  title="加粗"
                  onClick={() => updateAnnotation(ann.id, { bold: !ann.bold })}
                >
                  B
                </button>
                <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
                  <span className="hidden text-[10px] font-medium text-emerald-700/85 sm:text-[11px] lg:inline">颜色</span>
                  <span className="shrink-0 whitespace-nowrap text-[9px] font-medium leading-none text-emerald-700/85 lg:hidden">
                    字色
                  </span>
                  <input
                    type="color"
                    title="文字颜色"
                    aria-label="文字颜色"
                    className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-emerald-200 bg-white sm:h-8 sm:w-9 lg:h-9 lg:w-10"
                    value={ann.color}
                    onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })}
                  />
                </div>

                <div className="hidden basis-full lg:block" aria-hidden />

                <div className="max-lg:contents lg:flex lg:w-full lg:min-w-0 lg:items-center lg:gap-2">
                  <span className="hidden text-[10px] font-medium text-emerald-700/85 sm:text-[11px] lg:inline">背景色</span>
                  <span className="shrink-0 whitespace-nowrap text-[9px] font-medium leading-none text-emerald-700/85 lg:hidden">
                    背景色
                  </span>
                  <input
                    type="color"
                    title="背景色"
                    aria-label="背景色"
                    className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-emerald-200 bg-white sm:h-8 sm:w-9 lg:h-9 lg:w-10"
                    value={ann.background ?? '#ffffff'}
                    onChange={(e) => updateAnnotation(ann.id, { background: e.target.value })}
                  />
                  <span className="min-w-[4px] flex-1 max-lg:hidden" aria-hidden />
                  <button
                    type="button"
                    title="清除背景"
                    className="pc-btn-secondary shrink-0 px-1.5 py-1 text-[10px] max-lg:px-1.5 max-lg:py-1 sm:px-2 sm:py-1.5 sm:text-[11px] lg:px-2.5"
                    onClick={() => updateAnnotation(ann.id, { background: null })}
                  >
                    <span className="max-lg:hidden">清除背景</span>
                    <span className="lg:hidden">清除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {photo.annotations.length === 0 && (
            <div className="text-[10px] text-emerald-700/85 sm:text-xs">暂无批注</div>
          )}
        </div>
      </section>

      <section className="space-y-1.5 lg:space-y-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/85 sm:text-xs">图片操作</h2>
        <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
          <button
            type="button"
            title="逆时针旋转 90°"
            className="pc-btn-secondary min-w-0 truncate px-0.5 py-1.5 text-[10px] sm:px-1 sm:py-2 sm:text-xs lg:px-2"
            onClick={() => rotateImage('left')}
          >
            左转
          </button>
          <button
            type="button"
            title="顺时针旋转 90°"
            className="pc-btn-secondary min-w-0 truncate px-0.5 py-1.5 text-[10px] sm:px-1 sm:py-2 sm:text-xs lg:px-2"
            onClick={() => rotateImage('right')}
          >
            右转
          </button>
          <button
            type="button"
            title="水平翻转"
            className="pc-btn-secondary min-w-0 truncate px-0.5 py-1.5 text-[10px] sm:px-1 sm:py-2 sm:text-xs lg:px-2"
            onClick={() => flipImage('x')}
          >
            横翻
          </button>
          <button
            type="button"
            title="垂直翻转"
            className="pc-btn-secondary min-w-0 truncate px-0.5 py-1.5 text-[10px] sm:px-1 sm:py-2 sm:text-xs lg:px-2"
            onClick={() => flipImage('y')}
          >
            竖翻
          </button>
        </div>
      </section>

      <section>
        <button
          type="button"
          className="pc-btn-primary w-full max-lg:py-1.5 max-lg:text-[11px] sm:text-xs"
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
    <div className="grid grid-cols-[minmax(0,34px)_minmax(0,1fr)_42px] items-center gap-1 rounded-md border border-emerald-100 bg-white px-0.5 py-0.5 sm:grid-cols-[40px_1fr_52px] sm:gap-2 sm:px-1 sm:py-1">
      <label className="flex items-center gap-1 text-[10px] text-emerald-900/85 sm:gap-1.5 sm:text-xs">
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
        className="pc-input w-full px-1 py-0.5 text-center text-[11px] sm:px-1.5 sm:py-1 sm:text-xs"
        value={props.value}
        min={0}
        step={0.5}
        onChange={(e) => props.onValue(Number(e.target.value))}
        disabled={!props.enabled}
      />
    </div>
  )
}
