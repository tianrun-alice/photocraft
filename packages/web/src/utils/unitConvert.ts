import type { PhotoTemplate } from '@photocraft/shared'

export function mmToPx(mm: number, dpi: number = 96): number {
  return Math.round((mm * dpi) / 25.4)
}

export function pxToMm(px: number, dpi: number = 96): number {
  return (px * 25.4) / dpi
}

/** 与预览/导出一致：90°、270° 时交换宽高，批注坐标应在此坐标系内（mm）。 */
export function getRotatedTemplateMm(
  template: PhotoTemplate,
  rotation: 0 | 90 | 180 | 270 = 0,
): { widthMm: number; heightMm: number } {
  let wMm = template.mm.width
  let hMm = template.mm.height
  if (rotation === 90 || rotation === 270) [wMm, hMm] = [hMm, wMm]
  return { widthMm: wMm, heightMm: hMm }
}

/**
 * 在同一旋转角下，将批注从旧显示框 (w0×h0 mm) 映射到新框 (w1×h1)。
 * y 按行框垂直中点比例映射再还原为顶部，与旋转时逻辑一致。
 */
export function remapAnnotationMmInDisplayFrame(
  x: number,
  y: number,
  fontSizeMm: number,
  w0: number,
  h0: number,
  w1: number,
  h1: number,
): { x: number; y: number } {
  if (w0 <= 0 || h0 <= 0) return { x, y }
  const fs = Math.max(0, fontSizeMm)
  const mid = y + 0.5 * fs
  const midNew = (mid / h0) * h1
  const yNew = fs > 0 ? midNew - 0.5 * fs : (y / h0) * h1
  return { x: (x / w0) * w1, y: yNew }
}

/**
 * 模板旋转角变化时，将批注从旧显示框 (mm) 映射到新显示框。
 * x 为水平居中锚点；y 为文字顶部（与渲染 originY: top 一致）。
 */
export function remapAnnotationMmForRotationChange(
  x: number,
  y: number,
  fontSizeMm: number,
  oldRotation: 0 | 90 | 180 | 270,
  newRotation: 0 | 90 | 180 | 270,
  template: PhotoTemplate,
): { x: number; y: number } {
  const { widthMm: w0, heightMm: h0 } = getRotatedTemplateMm(template, oldRotation)
  const { widthMm: w1, heightMm: h1 } = getRotatedTemplateMm(template, newRotation)
  return remapAnnotationMmInDisplayFrame(x, y, fontSizeMm, w0, h0, w1, h1)
}

export function getExportDimensions(
  template: PhotoTemplate,
  rotation: 0 | 90 | 180 | 270 = 0,
  dpi: number = 300,
): { width: number; height: number } {
  const { widthMm, heightMm } = getRotatedTemplateMm(template, rotation)
  return { width: mmToPx(widthMm, dpi), height: mmToPx(heightMm, dpi) }
}

export function getPreviewDimensions(
  template: PhotoTemplate,
  rotation: 0 | 90 | 180 | 270 = 0,
  maxSize: number = 450,
  dpi: number = 96,
): { width: number; height: number; scale: number } {
  const { widthMm: wMm, heightMm: hMm } = getRotatedTemplateMm(template, rotation)

  const wPx = mmToPx(wMm, dpi)
  const hPx = mmToPx(hMm, dpi)
  const scale = Math.min(maxSize / Math.max(wPx, hPx), 1)

  return {
    width: Math.round(wPx * scale),
    height: Math.round(hPx * scale),
    scale,
  }
}

