import { useCallback, useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { exportPhotosToZip, type BatchZipLayout } from '@/utils/exportCanvas'

export function BatchExportButton() {
  const photos = useEditorStore((s) => s.photos)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [layout, setLayout] = useState<BatchZipLayout>('flat')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const closeDialog = useCallback(() => {
    if (progress) return
    setDialogOpen(false)
  }, [progress])

  useEffect(() => {
    if (!dialogOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDialog()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogOpen, closeDialog])

  if (photos.length === 0) return null

  async function runExport(chosen: BatchZipLayout) {
    setProgress({ done: 0, total: photos.length })
    try {
      await exportPhotosToZip(photos, chosen, 'jpeg', 0.95, (done, total) => setProgress({ done, total }))
    } finally {
      setProgress(null)
      setDialogOpen(false)
    }
  }

  return (
    <>
      <button type="button" className="pc-btn-primary w-full" onClick={() => setDialogOpen(true)} disabled={!!progress}>
        {progress ? `导出中 ${progress.done}/${progress.total}...` : '批量导出 ZIP'}
      </button>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDialog()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-export-title"
            className="pc-panel w-full max-w-sm space-y-4 p-4 shadow-lg shadow-emerald-900/10"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div>
              <h3 id="batch-export-title" className="text-sm font-semibold text-emerald-900">
                批量导出 ZIP
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-700/90">共 {photos.length} 张，请选择 ZIP 内的文件组织方式：</p>
            </div>

            <fieldset className="space-y-2.5 border-0 p-0">
              <legend className="sr-only">导出方式</legend>
              <label
                className={[
                  'flex cursor-pointer gap-2 rounded-md border px-3 py-2.5 transition-colors',
                  layout === 'flat' ? 'border-emerald-400 bg-emerald-50/90' : 'border-emerald-100 bg-emerald-50/40',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="batch-zip-layout"
                  className="mt-0.5 accent-emerald-600"
                  checked={layout === 'flat'}
                  onChange={() => setLayout('flat')}
                />
                <span className="text-xs text-emerald-900">
                  <span className="font-medium">全部平铺</span>
                  <span className="mt-0.5 block text-emerald-700/85">单一层级，文件名含尺寸与旋转角</span>
                </span>
              </label>
              <label
                className={[
                  'flex cursor-pointer gap-2 rounded-md border px-3 py-2.5 transition-colors',
                  layout === 'byTemplateFolder' ? 'border-emerald-400 bg-emerald-50/90' : 'border-emerald-100 bg-emerald-50/40',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="batch-zip-layout"
                  className="mt-0.5 accent-emerald-600"
                  checked={layout === 'byTemplateFolder'}
                  onChange={() => setLayout('byTemplateFolder')}
                />
                <span className="text-xs text-emerald-900">
                  <span className="font-medium">按尺寸分包</span>
                  <span className="mt-0.5 block text-emerald-700/85">按「5寸」「6寸」等分子文件夹，便于分尺寸冲印</span>
                </span>
              </label>
            </fieldset>

            <div className="flex justify-end gap-2">
              <button type="button" className="pc-btn-secondary px-3 py-2" onClick={closeDialog} disabled={!!progress}>
                取消
              </button>
              <button type="button" className="pc-btn-primary px-3 py-2" onClick={() => runExport(layout)} disabled={!!progress}>
                开始导出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
