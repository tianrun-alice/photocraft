import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type SyntheticEvent,
  type WheelEvent,
} from 'react'
import { useEditorStore } from '@/store/editorStore'
import { annotationMaxWrapWidthPx } from '@/utils/annotationLayout'
import { getPreviewDimensions, mmToPx, pxToMm } from '@/utils/unitConvert'

const PREVIEW_DPI = 96
const MAX_SIZE = 450
const PADDING = 40

export function PhotoCanvas() {
  const photo = useEditorStore((s) => s.photos.find((p) => p.id === s.selectedPhotoId) ?? null)
  const updateAnnotation = useEditorStore((s) => s.updateAnnotation)
  const setImageScale = useEditorStore((s) => s.setImageScale)
  const setImagePosition = useEditorStore((s) => s.setImagePosition)

  const [showOutside, setShowOutside] = useState(true)
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const [baseScale, setBaseScale] = useState<number>(1)
  const [zoomInput, setZoomInput] = useState<string>('100')

  const [dragMode, setDragMode] = useState<null | { kind: 'image' } | { kind: 'ann'; id: string }>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointerIdRef = useRef<number | null>(null)

  const imageDragOriginRef = useRef<{ imgX: number; imgY: number; clientX: number; clientY: number } | null>(null)
  const pendingImagePosRef = useRef<{ x: number; y: number } | null>(null)
  const imagePositionRafRef = useRef<number | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const imgNaturalRef = useRef<{ w: number; h: number } | null>(null)
  const initialFilledRef = useRef(false)

  const dims = useMemo(() => {
    if (!photo) return null
    const { width, height, scale } = getPreviewDimensions(photo.template, photo.templateRotation, MAX_SIZE, PREVIEW_DPI)
    return {
      previewWidth: width,
      previewHeight: height,
      scale,
      containerW: width + PADDING * 2,
      containerH: height + PADDING * 2,
    }
  }, [photo])

  useEffect(() => {
    initialFilledRef.current = false
    imgNaturalRef.current = null
    setImgNatural(null)
    setBaseScale(1)
    setZoomInput('100')
    setDragMode(null)
    lastPointRef.current = null
    dragPointerIdRef.current = null
  }, [photo?.id])

  useEffect(() => {
    if (!photo) return
    const zp = Math.max(0, (photo.imageScale / (baseScale || 1)) * 100)
    if (!Number.isFinite(zp)) return
    setZoomInput(zp.toFixed(1).replace(/\.0$/, ''))
  }, [photo?.id, photo?.imageScale, baseScale])

  if (!photo || !dims) {
    return (
      <div className="pc-panel p-6 text-center text-sm text-emerald-800/75">
        上传图片后开始编辑
      </div>
    )
  }

  const p = photo
  const d = dims

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget
    imgNaturalRef.current = { w: el.naturalWidth, h: el.naturalHeight }
    setImgNatural({ w: el.naturalWidth, h: el.naturalHeight })
    if (initialFilledRef.current) return

    const imgRatio = el.naturalWidth / el.naturalHeight
    const templateRatio = d.previewWidth / d.previewHeight
    const initialScale = imgRatio > templateRatio ? d.previewHeight / el.naturalHeight : d.previewWidth / el.naturalWidth
    setImageScale(initialScale)
    setBaseScale(initialScale)
    setZoomInput('100')
    setImagePosition(0, 0)
    initialFilledRef.current = true
  }

  function flushImageDragToStore() {
    if (imagePositionRafRef.current != null) {
      cancelAnimationFrame(imagePositionRafRef.current)
      imagePositionRafRef.current = null
    }
    const p = pendingImagePosRef.current
    if (p) {
      setImagePosition(p.x, p.y)
      pendingImagePosRef.current = null
    }
  }

  function startDrag(kind: 'image' | 'ann', e: PointerEvent, id?: string) {
    if (e.button !== 0) return
    if (!containerRef.current) return
    dragPointerIdRef.current = e.pointerId
    containerRef.current.setPointerCapture(e.pointerId)
    lastPointRef.current = { x: e.clientX, y: e.clientY }
    if (kind === 'image') {
      imageDragOriginRef.current = { imgX: p.imageX, imgY: p.imageY, clientX: e.clientX, clientY: e.clientY }
      pendingImagePosRef.current = null
      if (imagePositionRafRef.current != null) {
        cancelAnimationFrame(imagePositionRafRef.current)
        imagePositionRafRef.current = null
      }
    } else {
      imageDragOriginRef.current = null
      if (imagePositionRafRef.current != null) {
        cancelAnimationFrame(imagePositionRafRef.current)
        imagePositionRafRef.current = null
      }
      pendingImagePosRef.current = null
    }
    setDragMode(kind === 'image' ? { kind: 'image' } : { kind: 'ann', id: id! })
  }

  function onPointerDown(e: PointerEvent) {
    startDrag('image', e)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragMode) return
    if (dragPointerIdRef.current !== e.pointerId) return
    const last = lastPointRef.current
    if (!last) return
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    lastPointRef.current = { x: e.clientX, y: e.clientY }

    if (dragMode.kind === 'image') {
      const origin = imageDragOriginRef.current
      if (!origin) return
      const nextX = origin.imgX + (e.clientX - origin.clientX)
      const nextY = origin.imgY + (e.clientY - origin.clientY)
      pendingImagePosRef.current = { x: nextX, y: nextY }
      if (imagePositionRafRef.current == null) {
        imagePositionRafRef.current = requestAnimationFrame(() => {
          imagePositionRafRef.current = null
          const pending = pendingImagePosRef.current
          if (pending) {
            setImagePosition(pending.x, pending.y)
            pendingImagePosRef.current = null
          }
        })
      }
      return
    }

    if (dragMode.kind === 'ann') {
      const dMmX = pxToMm(dx / d.scale, PREVIEW_DPI)
      const dMmY = pxToMm(dy / d.scale, PREVIEW_DPI)
      const ann = p.annotations.find((a) => a.id === dragMode.id)
      if (!ann) return
      updateAnnotation(dragMode.id, { x: ann.x + dMmX, y: ann.y + dMmY })
    }
  }

  function endDrag(e?: PointerEvent) {
    flushImageDragToStore()
    if (e && containerRef.current && dragPointerIdRef.current === e.pointerId) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }
    imageDragOriginRef.current = null
    setDragMode(null)
    lastPointRef.current = null
    dragPointerIdRef.current = null
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setImageScale(p.imageScale + delta)
  }

  const zoomPercent = Math.max(0, (p.imageScale / (baseScale || 1)) * 100)
  const applyZoomPercent = (pct: number) => {
    const next = (baseScale || 1) * (pct / 100)
    setImageScale(next)
  }

  const imgTransform = `translate(${p.imageX}px, ${p.imageY}px) scale(${p.imageScale}) rotate(${p.imageRotation}deg) scaleX(${
    p.imageFlipX ? -1 : 1
  }) scaleY(${p.imageFlipY ? -1 : 1})`

  const borderToPx = (mm: number) => Math.round(mmToPx(mm, PREVIEW_DPI) * d.scale)
  const bt = p.border.enabled.top ? borderToPx(p.border.top) : 0
  const bb = p.border.enabled.bottom ? borderToPx(p.border.bottom) : 0
  const bl = p.border.enabled.left ? borderToPx(p.border.left) : 0
  const br = p.border.enabled.right ? borderToPx(p.border.right) : 0
  return (
    <div className="pc-panel p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-emerald-900">
          模板：{p.template.name} · {p.templateRotation}°
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="pc-btn-secondary"
            onClick={() => setShowOutside((v) => !v)}
          >
            {showOutside ? '隐藏框外' : '显示框外'}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto touch-none cursor-grab active:cursor-grabbing"
        style={{ width: d.containerW, height: d.containerH }}
        onPointerDown={(e) => {
          if (e.button === 0) e.preventDefault()
          onPointerDown(e)
        }}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e)}
        onPointerCancel={(e) => endDrag(e)}
        onWheel={onWheel}
      >
        {showOutside && (
          <img
            src={p.dataUrl}
            alt=""
            draggable={false}
            onDragStart={(ev) => ev.preventDefault()}
            className="absolute left-1/2 top-1/2 opacity-30 pointer-events-none"
            style={{
              width: imgNatural?.w,
              height: imgNatural?.h,
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(-50%, -50%) ${imgTransform}`,
              transformOrigin: 'center center',
            }}
          />
        )}

        <div
          data-export-target="template-box"
          className="absolute left-1/2 top-1/2 bg-white overflow-hidden"
          style={{
            width: d.previewWidth,
            height: d.previewHeight,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src={p.dataUrl}
            alt=""
            draggable={false}
            onDragStart={(ev) => ev.preventDefault()}
            onLoad={onImageLoad}
            className="absolute left-1/2 top-1/2 select-none"
            style={{
              width: imgNatural?.w,
              height: imgNatural?.h,
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(-50%, -50%) ${imgTransform}`,
              transformOrigin: 'center center',
            }}
          />

          {bt > 0 && <div className="absolute left-0 top-0 w-full" style={{ height: bt, background: p.borderColor }} />}
          {bb > 0 && (
            <div className="absolute left-0 bottom-0 w-full" style={{ height: bb, background: p.borderColor }} />
          )}
          {bl > 0 && <div className="absolute left-0 top-0 h-full" style={{ width: bl, background: p.borderColor }} />}
          {br > 0 && (
            <div className="absolute right-0 top-0 h-full" style={{ width: br, background: p.borderColor }} />
          )}
        </div>

        <div
          className="absolute left-1/2 top-1/2 border-2 border-emerald-800/70 pointer-events-none rounded-[1px]"
          style={{
            width: d.previewWidth,
            height: d.previewHeight,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {p.annotations.map((ann) => {
          const x = PADDING + Math.round(mmToPx(ann.x, PREVIEW_DPI) * d.scale)
          const y = PADDING + Math.round(mmToPx(ann.y, PREVIEW_DPI) * d.scale)
          const fontSizePx = Math.max(10, Math.round(mmToPx(ann.fontSize, PREVIEW_DPI) * d.scale))
          const fontWeight = ann.bold ? 700 : 400
          const maxWidthPx = annotationMaxWrapWidthPx({
            contentWidthPx: d.previewWidth,
            borderLeftPx: bl,
            borderRightPx: br,
          })

          return (
            <AnnotationView
              key={ann.id}
              id={ann.id}
              x={x}
              y={y}
              text={ann.text}
              fontSizePx={fontSizePx}
              color={ann.color}
              fontWeight={fontWeight}
              background={ann.background}
              maxWidthPx={maxWidthPx}
              onPointerDown={(e) => startDrag('ann', e, ann.id)}
            />
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          className="pc-btn-secondary text-sm px-3 py-1"
          onClick={() => applyZoomPercent(Math.max(0.01, zoomPercent - 1))}
        >
          -
        </button>
        <div className="flex items-center gap-1">
          <input
            className="pc-input text-sm text-emerald-900 w-20 text-center py-1"
            inputMode="decimal"
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value)}
            onBlur={() => {
              const v = Number(zoomInput)
              if (!Number.isFinite(v) || v <= 0) {
                setZoomInput(zoomPercent.toFixed(1).replace(/\.0$/, ''))
                return
              }
              applyZoomPercent(v)
              setZoomInput(v.toString())
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setZoomInput(zoomPercent.toFixed(1).replace(/\.0$/, ''))
            }}
          />
          <div className="text-sm text-emerald-800/80">%</div>
        </div>
        <button
          type="button"
          className="pc-btn-secondary text-sm px-3 py-1"
          onClick={() => applyZoomPercent(zoomPercent + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

function AnnotationView(props: {
  id: string
  x: number
  y: number
  text: string
  fontSizePx: number
  color: string
  fontWeight: number
  background: string | null
  maxWidthPx: number
  onPointerDown: (e: PointerEvent) => void
}) {
  const updateAnnotation = useEditorStore((s) => s.updateAnnotation)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(props.text)

  useEffect(() => setValue(props.text), [props.text])

  function commit() {
    updateAnnotation(props.id, { text: value.trim() || ' ' })
    setEditing(false)
  }

  return (
    <div
      className="absolute cursor-move text-center box-border"
      style={{
        left: props.x,
        top: props.y,
        width: props.maxWidthPx,
        maxWidth: props.maxWidthPx,
        transform: 'translate(-50%, 0)',
        fontSize: props.fontSizePx,
        fontWeight: props.fontWeight,
        color: props.color,
        background: props.background ?? 'transparent',
        padding: props.background ? '2px 4px' : undefined,
        borderRadius: props.background ? 6 : undefined,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: 1.25,
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        props.onPointerDown(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
    >
      {editing ? (
        <input
          className="pc-input w-full min-w-0 max-w-full px-1.5 py-1 text-left"
          style={{ maxWidth: props.maxWidthPx }}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
        />
      ) : (
        props.text
      )}
    </div>
  )
}

