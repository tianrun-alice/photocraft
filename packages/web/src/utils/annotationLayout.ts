/**
 * 批注换行最大宽度 = 白区横向像素宽度减去左右边框（与照片可视横向一致）。
 * 不再按锚点做 2×半宽收缩，避免与 mm→px 取整叠加后远小于内缘宽度。
 */
export function annotationMaxWrapWidthPx(opts: {
  contentWidthPx: number
  borderLeftPx: number
  borderRightPx: number
}): number {
  const { contentWidthPx, borderLeftPx, borderRightPx } = opts
  return Math.max(40, Math.floor(Math.max(0, contentWidthPx - borderLeftPx - borderRightPx)))
}
