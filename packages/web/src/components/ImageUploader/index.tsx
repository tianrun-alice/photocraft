import { useMemo, useRef, useState, type DragEvent } from 'react'
import { PHOTO_TEMPLATES, type PhotoItem } from '@photocraft/shared'
import { useEditorStore } from '@/store/editorStore'
import { exportPhotosToZip, safeZipSegment } from '@/utils/exportCanvas'
import { armPhotoListScrollRestore } from '@/utils/photoScrollRestore'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const TEMPLATE_NAME_ORDER = PHOTO_TEMPLATES.map((t) => t.name)

function sortTemplateNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ia = TEMPLATE_NAME_ORDER.indexOf(a)
    const ib = TEMPLATE_NAME_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'zh')
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

function groupPhotosByTemplateName(photos: PhotoItem[]): { name: string; items: PhotoItem[] }[] {
  const map = new Map<string, PhotoItem[]>()
  for (const p of photos) {
    const k = p.template.name
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(p)
  }
  return sortTemplateNames([...map.keys()]).map((name) => ({ name, items: map.get(name)! }))
}

export function ImageUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const photos = useEditorStore((s) => s.photos)
  const selectedPhotoId = useEditorStore((s) => s.selectedPhotoId)
  const addPhoto = useEditorStore((s) => s.addPhoto)
  const selectPhoto = useEditorStore((s) => s.selectPhoto)

  const [groupBySize, setGroupBySize] = useState(false)
  const [exportingGroupName, setExportingGroupName] = useState<string | null>(null)

  const hasPhotos = photos.length > 0

  const groups = useMemo(() => (groupBySize ? groupPhotosByTemplateName(photos) : null), [photos, groupBySize])

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

  function renderThumb(p: PhotoItem) {
    return (
      <button
        key={p.id}
        type="button"
        className={[
          'relative aspect-square overflow-hidden rounded-md border transition-shadow',
          p.id === selectedPhotoId ? 'pc-selected' : 'border-emerald-200 hover:border-emerald-300',
        ].join(' ')}
        onPointerDown={() => armPhotoListScrollRestore()}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => selectPhoto(p.id)}
        title={`${p.template.name} · 点击选中`}
      >
        <img src={p.dataUrl} alt="" draggable={false} className="h-full w-full object-cover pointer-events-none" />
      </button>
    )
  }

  if (!hasPhotos) {
    return (
      <div
        className="cursor-pointer rounded-lg border-2 border-dashed border-emerald-300 p-4 text-center text-sm text-emerald-800/90 transition-colors hover:bg-emerald-50/80"
        onClick={openPicker}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="font-medium text-emerald-900">拖拽图片到这里</div>
        <div className="mt-1 text-xs text-emerald-700/80">或点击选择（可多选）</div>
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
      {groupBySize && groups ? (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.name}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="min-w-0 text-[11px] font-semibold text-emerald-800/90">
                  <span className="truncate">{g.name}</span>
                  <span className="ml-1 font-normal text-emerald-600/90">({g.items.length})</span>
                </div>
                <button
                  type="button"
                  className="pc-btn-secondary shrink-0 px-2 py-1 text-[10px] font-medium"
                  disabled={exportingGroupName !== null}
                  onClick={async () => {
                    setExportingGroupName(g.name)
                    try {
                      const base = `photocraft-${safeZipSegment(g.name)}-${Date.now()}`
                      await exportPhotosToZip(g.items, 'flat', 'jpeg', 0.95, undefined, base)
                    } finally {
                      setExportingGroupName(null)
                    }
                  }}
                >
                  {exportingGroupName === g.name ? '导出中…' : '导出本组 ZIP'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-2 lg:gap-2">{g.items.map((p) => renderThumb(p))}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-2 lg:gap-2">
          {photos.map((p) => renderThumb(p))}
          <button
            type="button"
            className="aspect-square rounded-md border-2 border-dashed border-emerald-300 text-xl font-light leading-none text-emerald-800/80 hover:bg-emerald-50/80 lg:text-2xl"
            onClick={openPicker}
          >
            +
          </button>
        </div>
      )}

      <button
        type="button"
        className="pc-btn-secondary w-full py-2 text-[11px]"
        onClick={() => setGroupBySize((v) => !v)}
      >
        {groupBySize ? '取消分组' : '按照尺寸分组'}
      </button>

      {groupBySize && (
        <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-2 lg:gap-2">
          <button
            type="button"
            className="aspect-square rounded-md border-2 border-dashed border-emerald-300 text-xl font-light leading-none text-emerald-800/80 hover:bg-emerald-50/80 lg:text-2xl"
            onClick={openPicker}
          >
            +
          </button>
        </div>
      )}

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
