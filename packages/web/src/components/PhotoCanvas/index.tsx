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
const DESKTOP_OUTER_PAD = 40
const MOBILE_OUTER_PAD = 12

function coverFitScale(naturalW: number, naturalH: number, previewW: number, previewH: number): number {
  const imgRatio = naturalW / naturalH
  const templateRatio = previewW / previewH
  return imgRatio > templateRatio ? previewH / naturalH : previewW / naturalW
}

export function PhotoCanvas() {
  const photo = useEditorStore((s) => s.photos.find((p) => p.id === s.selectedPhotoId) ?? null)
  const updateAnnotation = useEditorStore((s) => s.updateAnnotation)
  const setImageScale = useEditorStore((s) => s.setImageScale)
  const setImagePosition = useEditorStore((s) => s.setImagePosition)

  const [showOutside, setShowOutside] = useState(true)
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const [baseScale, setBaseScale] = useState<number>(1)
  const [zoomInput, setZoomInput] = useState<string>('100')
  const [layoutPad, setLayoutPad] = useState(DESKTOP_OUTER_PAD)

  const [dragMode, setDragMode] = useState<null | { kind: 'image' } | { kind: 'ann'; id: string }>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointerIdRef = useRef<number | null>(null)

  const imageDragOriginRef = useRef<{ imgX: number; imgY: number; clientX: number; clientY: number } | null>(null)
  const pendingImagePosRef = useRef<{ x: number; y: number } | null>(null)
  const imagePositionRafRef = useRef<number | null>(null)
  /** 正在拖拽位移的照片 id，避免 RAF / flush 在切换选中后写到错误照片 */
  const imageDragPhotoIdRef = useRef<string | null>(null)
  /** 已做过首次入框缩放+居中的照片，切回时不再 reset 位移与缩放 */
  const laidOutPhotoIdsRef = useRef<Set<string>>(new Set())

  const containerRef = useRef<HTMLDivElement | null>(null)
  const fitWrapRef = useRef<HTMLDivElement | null>(null)
  const [fitWrapW, setFitWrapW] = useState(0)
  const fitScaleRef = useRef(1)
  const imgNaturalRef = useRef<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const apply = () => setLayoutPad(mq.matches ? MOBILE_OUTER_PAD : DESKTOP_OUTER_PAD)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = fitWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setFitWrapW(el.clientWidth))
    ro.observe(el)
    setFitWrapW(el.clientWidth)
    return () => ro.disconnect()
  }, [photo?.id])

  const dims = useMemo(() => {
    if (!photo) return null
    const { width, height, scale } = getPreviewDimensions(photo.template, photo.templateRotation, MAX_SIZE, PREVIEW_DPI)
    return {
      previewWidth: width,
      previewHeight: height,
      scale,
      layoutPad,
      containerW: width + layoutPad * 2,
      containerH: height + layoutPad * 2,
    }
  }, [photo, layoutPad])

  useEffect(() => {
    imgNaturalRef.current = null
    setImgNatural(null)
    setBaseScale(1)
    setDragMode(null)
    lastPointRef.current = null
    dragPointerIdRef.current = null
    imageDragPhotoIdRef.current = null
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

  /** 小屏下用 CSS scale 缩放到容器宽，保持与导出一致的 450px 逻辑坐标系 */
  const fitScale =
    d.containerW > 0 && fitWrapW > 0 ? Math.min(1, Math.max(0.22, fitWrapW / d.containerW)) : 1
  fitScaleRef.current = fitScale

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget
    imgNaturalRef.current = { w: el.naturalWidth, h: el.naturalHeight }
    setImgNatural({ w: el.naturalWidth, h: el.naturalHeight })

    const laidOut = laidOutPhotoIdsRef.current
    if (laidOut.has(p.id)) {
      const fit = coverFitScale(el.naturalWidth, el.naturalHeight, d.previewWidth, d.previewHeight)
      setBaseScale(fit)
      return
    }

    laidOut.add(p.id)
    const initialScale = coverFitScale(el.naturalWidth, el.naturalHeight, d.previewWidth, d.previewHeight)
    setImageScale(p.id, initialScale)
    setBaseScale(initialScale)
    setZoomInput('100')
    setImagePosition(p.id, 0, 0)
  }

  function flushImageDragToStore() {
    if (imagePositionRafRef.current != null) {
      cancelAnimationFrame(imagePositionRafRef.current)
      imagePositionRafRef.current = null
    }
    const pos = pendingImagePosRef.current
    const dragId = imageDragPhotoIdRef.current
    if (pos && dragId) {
      setImagePosition(dragId, pos.x, pos.y)
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
      imageDragPhotoIdRef.current = p.id
      imageDragOriginRef.current = { imgX: p.imageX, imgY: p.imageY, clientX: e.clientX, clientY: e.clientY }
      pendingImagePosRef.current = null
      if (imagePositionRafRef.current != null) {
        cancelAnimationFrame(imagePositionRafRef.current)
        imagePositionRafRef.current = null
      }
    } else {
      imageDragPhotoIdRef.current = null
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
      const fs = fitScaleRef.current || 1
      const nextX = origin.imgX + (e.clientX - origin.clientX) / fs
      const nextY = origin.imgY + (e.clientY - origin.clientY) / fs
      pendingImagePosRef.current = { x: nextX, y: nextY }
      if (imagePositionRafRef.current == null) {
        imagePositionRafRef.current = requestAnimationFrame(() => {
          imagePositionRafRef.current = null
          const pending = pendingImagePosRef.current
          const dragId = imageDragPhotoIdRef.current
          if (pending && dragId) {
            setImagePosition(dragId, pending.x, pending.y)
            pendingImagePosRef.current = null
          }
        })
      }
      return
    }

    if (dragMode.kind === 'ann') {
      const fs = fitScaleRef.current || 1
      const dMmX = pxToMm(dx / fs / d.scale, PREVIEW_DPI)
      const dMmY = pxToMm(dy / fs / d.scale, PREVIEW_DPI)
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
    imageDragPhotoIdRef.current = null
    setDragMode(null)
    lastPointRef.current = null
    dragPointerIdRef.current = null
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setImageScale(p.id, p.imageScale + delta)
  }

  const zoomPercent = Math.max(0, (p.imageScale / (baseScale || 1)) * 100)
  const applyZoomPercent = (pct: number) => {
    const next = (baseScale || 1) * (pct / 100)
    setImageScale(p.id, next)
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
    <div className="pc-panel touch-manipulation p-2 select-none sm:p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm text-emerald-900">
          模板：{p.template.name} · {p.templateRotation}°
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="pc-btn-secondary"
            onClick={() => setShowOutside((v) => !v)}
          >
            {showOutside ? '隐藏框外' : '显示框外'}
          </button>
        </div>
      </div>

      <div ref={fitWrapRef} className="max-w-full overflow-x-auto">
        <div
          className="mx-auto"
          style={{
            width: d.containerW * fitScale,
            height: d.containerH * fitScale,
          }}
        >
          <div
            className="relative touch-none cursor-grab active:cursor-grabbing"
            style={{
              width: d.containerW,
              height: d.containerH,
              transform: `scale(${fitScale})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              ref={containerRef}
              className="relative h-full w-full"
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
          const x = d.layoutPad + Math.round(mmToPx(ann.x, PREVIEW_DPI) * d.scale)
          const y = d.layoutPad + Math.round(mmToPx(ann.y, PREVIEW_DPI) * d.scale)
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
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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

