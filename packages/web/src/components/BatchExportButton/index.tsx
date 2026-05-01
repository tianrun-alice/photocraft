import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { exportAllPhotos } from '@/utils/exportCanvas'

export function BatchExportButton() {
  const photos = useEditorStore((s) => s.photos)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  if (photos.length === 0) return null

  async function onExport() {
    setProgress({ done: 0, total: photos.length })
    try {
      await exportAllPhotos(photos, 'jpeg', 0.95, (done, total) => setProgress({ done, total }))
    } finally {
      setProgress(null)
    }
  }

  return (
    <button
      type="button"
      className="w-full text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
      onClick={onExport}
      disabled={!!progress}
    >
      {progress ? `导出中 ${progress.done}/${progress.total}...` : '批量导出 ZIP'}
    </button>
  )
}
