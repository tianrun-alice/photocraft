import type { PhotoItem } from '@photocraft/shared'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { fabric } from 'fabric'
import { getPreviewDimensions, mmToPx } from '@/utils/unitConvert'

const PREVIEW_DPI = 96
const MAX_SIZE = 450
const EXPORT_DPI = 300
const multiplier = EXPORT_DPI / PREVIEW_DPI

function pad3(n: number) {
  return n.toString().padStart(3, '0')
}

function filenameFor(photo: PhotoItem, format: 'jpeg' | 'png') {
  return `photocraft-${photo.template.name}-${photo.templateRotation}deg-${Date.now()}.${format}`
}

async function renderPhotoToDataUrl(
  photo: PhotoItem,
  format: 'jpeg' | 'png',
  quality: number,
): Promise<string> {
  const { width: previewWidth, height: previewHeight } = getPreviewDimensions(
    photo.template,
    photo.templateRotation,
    MAX_SIZE,
    PREVIEW_DPI,
  )

  const el = document.createElement('canvas')
  el.width = previewWidth
  el.height = previewHeight

  const fCanvas = new fabric.Canvas(el, { backgroundColor: '#ffffff' })

  return await new Promise<string>((resolve, reject) => {
    fabric.Image.fromURL(
      photo.dataUrl,
      (img: any) => {
        try {
          img.set({
            scaleX: photo.imageScale,
            scaleY: photo.imageScale,
            left: previewWidth / 2 + photo.imageX,
            top: previewHeight / 2 + photo.imageY,
            originX: 'center',
            originY: 'center',
            angle: photo.imageRotation,
            flipX: photo.imageFlipX,
            flipY: photo.imageFlipY,
          })

          fCanvas.add(img)

          // borders
          const wMm =
            photo.templateRotation === 90 || photo.templateRotation === 270
              ? photo.template.mm.height
              : photo.template.mm.width
          const hMm =
            photo.templateRotation === 90 || photo.templateRotation === 270
              ? photo.template.mm.width
              : photo.template.mm.height

          const wPxRaw = mmToPx(wMm, PREVIEW_DPI)
          const hPxRaw = mmToPx(hMm, PREVIEW_DPI)
          const scale = Math.min(MAX_SIZE / Math.max(wPxRaw, hPxRaw), 1)

          const borderToPx = (mm: number) => Math.round(mmToPx(mm, PREVIEW_DPI) * scale)

          const bt = photo.border.enabled.top ? borderToPx(photo.border.top) : 0
          const bb = photo.border.enabled.bottom ? borderToPx(photo.border.bottom) : 0
          const bl = photo.border.enabled.left ? borderToPx(photo.border.left) : 0
          const br = photo.border.enabled.right ? borderToPx(photo.border.right) : 0

          if (bt > 0)
            fCanvas.add(
              new fabric.Rect({
                left: 0,
                top: 0,
                width: previewWidth,
                height: bt,
                fill: photo.borderColor,
                selectable: false,
                evented: false,
              }),
            )
          if (bb > 0)
            fCanvas.add(
              new fabric.Rect({
                left: 0,
                top: previewHeight - bb,
                width: previewWidth,
                height: bb,
                fill: photo.borderColor,
                selectable: false,
                evented: false,
              }),
            )
          if (bl > 0)
            fCanvas.add(
              new fabric.Rect({
                left: 0,
                top: 0,
                width: bl,
                height: previewHeight,
                fill: photo.borderColor,
                selectable: false,
                evented: false,
              }),
            )
          if (br > 0)
            fCanvas.add(
              new fabric.Rect({
                left: previewWidth - br,
                top: 0,
                width: br,
                height: previewHeight,
                fill: photo.borderColor,
                selectable: false,
                evented: false,
              }),
            )

          // annotations
          for (const ann of photo.annotations) {
            const annXPx = Math.round(mmToPx(ann.x, PREVIEW_DPI) * scale)
            const annYPx = Math.round(mmToPx(ann.y, PREVIEW_DPI) * scale)
            const fontSize = Math.max(1, Math.round(mmToPx(ann.fontSize, PREVIEW_DPI) * scale))

            const fontWeight = ann.bold ? 'bold' : 'normal'
            const bgPadding = Math.max(2, Math.round(fontSize * 0.25))

            if (ann.background) {
              const bgText = new fabric.IText(ann.text, {
                fontSize,
                fontWeight,
                visible: false,
              })
              const textWidth = bgText.width || ann.text.length * fontSize * 0.6
              fCanvas.add(
                new fabric.Rect({
                  left: annXPx - textWidth / 2 - bgPadding,
                  top: annYPx - bgPadding,
                  width: textWidth + bgPadding * 2,
                  height: fontSize * 1.2 + bgPadding * 2,
                  fill: ann.background,
                  opacity: 0.8,
                  rx: fontSize * 0.08,
                  ry: fontSize * 0.08,
                  selectable: false,
                  evented: false,
                }),
              )
            }

            fCanvas.add(
              new fabric.IText(ann.text, {
                left: annXPx,
                top: annYPx,
                originX: 'center',
                originY: 'top',
                fontSize,
                fill: ann.color,
                fontWeight,
                selectable: false,
                evented: false,
              }),
            )
          }

          fCanvas.renderAll()
          const dataUrl = fCanvas.toDataURL({ format, quality, multiplier })
          fCanvas.dispose()
          resolve(dataUrl)
        } catch (e) {
          fCanvas.dispose()
          reject(e)
        }
      },
      { crossOrigin: 'anonymous' },
    )
  })
}

export async function exportCanvas(photo: PhotoItem, format: 'jpeg' | 'png' = 'jpeg', quality = 0.95) {
  const dataUrl = await renderPhotoToDataUrl(photo, format, quality)
  saveAs(dataUrl, filenameFor(photo, format))
}

/** 平铺：所有文件在同一层；按尺寸分包：按模板名分子文件夹 */
export type BatchZipLayout = 'flat' | 'byTemplateFolder'

export function safeZipSegment(name: string): string {
  const t = name.replace(/[/\\:*?"<>|]/g, '_').trim()
  return t || 'export'
}

export async function exportPhotosToZip(
  photos: PhotoItem[],
  layout: BatchZipLayout,
  format: 'jpeg' | 'png' = 'jpeg',
  quality = 0.95,
  onProgress?: (done: number, total: number) => void,
  zipBaseName?: string,
) {
  const zip = new JSZip()
  const total = photos.length
  const folderIndex = new Map<string, number>()

  for (let i = 0; i < total; i++) {
    const photo = photos[i]
    const dataUrl = await renderPhotoToDataUrl(photo, format, quality)
    const base64 = dataUrl.split(',')[1]

    let pathInZip: string
    if (layout === 'flat') {
      pathInZip = `${pad3(i + 1)}-${photo.template.name}-${photo.templateRotation}deg.${format}`
    } else {
      const folder = safeZipSegment(photo.template.name)
      const next = (folderIndex.get(folder) ?? 0) + 1
      folderIndex.set(folder, next)
      pathInZip = `${folder}/${pad3(next)}-${photo.templateRotation}deg.${format}`
    }

    zip.file(pathInZip, base64, { base64: true })
    onProgress?.(i + 1, total)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const base = zipBaseName ?? `photocraft-export-${Date.now()}`
  saveAs(blob, base.endsWith('.zip') ? base : `${base}.zip`)
}

export async function exportAllPhotos(
  photos: PhotoItem[],
  format: 'jpeg' | 'png' = 'jpeg',
  quality = 0.95,
  onProgress?: (done: number, total: number) => void,
) {
  await exportPhotosToZip(photos, 'flat', format, quality, onProgress)
}

