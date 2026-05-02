import type { PhotoItem } from '@photocraft/shared'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { fabric } from 'fabric'
import { annotationMaxWrapWidthPx } from '@/utils/annotationLayout'
import { getExportDimensions, getPreviewDimensions, mmToPx } from '@/utils/unitConvert'

const PREVIEW_DPI = 96
const MAX_SIZE = 450
const EXPORT_DPI = 300

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
  const { width: previewWidth } = getPreviewDimensions(
    photo.template,
    photo.templateRotation,
    MAX_SIZE,
    PREVIEW_DPI,
  )
  const { width: exportWidth, height: exportHeight } = getExportDimensions(
    photo.template,
    photo.templateRotation,
    EXPORT_DPI,
  )
  /** 与编辑器预览同一套 mm→像素比例；在此比例下直接铺 300DPI 画布，避免小画布×multiplier 放大发糊 */
  const pxRatio = exportWidth / previewWidth

  const el = document.createElement('canvas')
  el.width = exportWidth
  el.height = exportHeight

  const fCanvas = new fabric.Canvas(el, { backgroundColor: '#ffffff' })

  return await new Promise<string>((resolve, reject) => {
    fabric.Image.fromURL(
      photo.dataUrl,
      (img: any) => {
        try {
          img.set({
            scaleX: photo.imageScale * pxRatio,
            scaleY: photo.imageScale * pxRatio,
            left: exportWidth / 2 + photo.imageX * pxRatio,
            top: exportHeight / 2 + photo.imageY * pxRatio,
            originX: 'center',
            originY: 'center',
            angle: photo.imageRotation,
            flipX: photo.imageFlipX,
            flipY: photo.imageFlipY,
          })

          fCanvas.add(img)

          // borders（毫米 → 导出画布像素，与预览中 mm→预览像素 线性一致）
          const borderToPx = (mm: number) => Math.round(mmToPx(mm, EXPORT_DPI))

          const bt = photo.border.enabled.top ? borderToPx(photo.border.top) : 0
          const bb = photo.border.enabled.bottom ? borderToPx(photo.border.bottom) : 0
          const bl = photo.border.enabled.left ? borderToPx(photo.border.left) : 0
          const br = photo.border.enabled.right ? borderToPx(photo.border.right) : 0

          if (bt > 0)
            fCanvas.add(
              new fabric.Rect({
                left: 0,
                top: 0,
                width: exportWidth,
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
                top: exportHeight - bb,
                width: exportWidth,
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
                height: exportHeight,
                fill: photo.borderColor,
                selectable: false,
                evented: false,
              }),
            )
          if (br > 0)
            fCanvas.add(
              new fabric.Rect({
                left: exportWidth - br,
                top: 0,
                width: br,
                height: exportHeight,
                fill: photo.borderColor,
                selectable: false,
                evented: false,
              }),
            )

          // annotations（与预览一致：换行宽度不超过左右边框内照片可视宽度）
          const TextboxCtor = (fabric as unknown as { Textbox: new (text: string, opts?: object) => fabric.Object }).Textbox
          for (const ann of photo.annotations) {
            const annXPx = Math.round(mmToPx(ann.x, EXPORT_DPI))
            const annYPx = Math.round(mmToPx(ann.y, EXPORT_DPI))
            const fontSize = Math.max(1, Math.round(mmToPx(ann.fontSize, EXPORT_DPI)))

            const fontWeight = ann.bold ? 'bold' : 'normal'
            const bgPadding = Math.max(2, Math.round(fontSize * 0.25))
            const wrapW = annotationMaxWrapWidthPx({
              contentWidthPx: exportWidth,
              borderLeftPx: bl,
              borderRightPx: br,
            })

            const tb = new TextboxCtor(ann.text, {
              width: wrapW,
              left: annXPx,
              top: annYPx,
              originX: 'center',
              originY: 'top',
              fontSize,
              fill: ann.color,
              fontWeight,
              textAlign: 'center',
              splitByGrapheme: true,
              selectable: false,
              evented: false,
            })

            fCanvas.add(tb)
            const tbox = tb as fabric.Object & { initDimensions?: () => void }
            tbox.initDimensions?.()

            if (ann.background) {
              const bbox = tbox.getBoundingRect(true, true)
              const bgRect = new fabric.Rect({
                left: bbox.left - bgPadding,
                top: bbox.top - bgPadding,
                width: bbox.width + bgPadding * 2,
                height: bbox.height + bgPadding * 2,
                fill: ann.background,
                opacity: 0.8,
                rx: fontSize * 0.08,
                ry: fontSize * 0.08,
                selectable: false,
                evented: false,
              })
              fCanvas.add(bgRect)
              bgRect.sendToBack()
            }
          }

          fCanvas.renderAll()
          const dataUrl = fCanvas.toDataURL({ format, quality, multiplier: 1 })
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

