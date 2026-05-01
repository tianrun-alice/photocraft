import { useMemo, useRef, type DragEvent } from 'react'
import { useEditorStore } from '@/store/editorStore'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ImageUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const photos = useEditorStore((s) => s.photos)
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  const addPhoto = useEditorStore((s) => s.addPhoto)
  const selectPhoto = useEditorStore((s) => s.selectPhoto)

  const hasPhotos = photos.length > 0

  const sorted = useMemo(() => photos, [photos])

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    const imgFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    for (const f of imgFiles) {
      const dataUrl = await readFileAsDataUrl(f)
      addPhoto(dataUrl)
    }
  }

  function openPicker() {
    inputRef.current?.click()
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  if (!hasPhotos) {
    return (
      <div
        className="border-2 border-dashed rounded-md p-4 text-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50"
        onClick={openPicker}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="font-medium text-gray-700">拖拽图片到这里</div>
        <div className="text-xs text-gray-500 mt-1">或点击选择（可多选）</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((p) => (
          <button
            key={p.id}
            type="button"
            className={[
              'relative aspect-square overflow-hidden rounded border',
              p.id === selectedPhotoId ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200',
            ].join(' ')}
            onClick={() => selectPhoto(p.id)}
            title="点击选中"
          >
            <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
        <button
          type="button"
          className="aspect-square rounded border-2 border-dashed border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={openPicker}
        >
          +
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

