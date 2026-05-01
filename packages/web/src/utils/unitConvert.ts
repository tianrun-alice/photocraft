import type { PhotoTemplate } from '@photocraft/shared'

export function mmToPx(mm: number, dpi: number = 96): number {
  return Math.round((mm * dpi) / 25.4)
}

export function pxToMm(px: number, dpi: number = 96): number {
  return (px * 25.4) / dpi
}

export function getExportDimensions(
  template: PhotoTemplate,
  rotation: 0 | 90 | 180 | 270 = 0,
  dpi: number = 300,
): { width: number; height: number } {
  let wMm = template.mm.width
  let hMm = template.mm.height
  if (rotation === 90 || rotation === 270) [wMm, hMm] = [hMm, wMm]
  return { width: mmToPx(wMm, dpi), height: mmToPx(hMm, dpi) }
}

export function getPreviewDimensions(
  template: PhotoTemplate,
  rotation: 0 | 90 | 180 | 270 = 0,
  maxSize: number = 450,
  dpi: number = 96,
): { width: number; height: number; scale: number } {
  let wMm = template.mm.width
  let hMm = template.mm.height
  if (rotation === 90 || rotation === 270) [wMm, hMm] = [hMm, wMm]

  const wPx = mmToPx(wMm, dpi)
  const hPx = mmToPx(hMm, dpi)
  const scale = Math.min(maxSize / Math.max(wPx, hPx), 1)

  return {
    width: Math.round(wPx * scale),
    height: Math.round(hPx * scale),
    scale,
  }
}

