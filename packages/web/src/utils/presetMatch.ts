import type { Annotation, BorderConfig, PhotoItem, PresetTemplate } from '@photocraft/shared'

function bordersEqual(a: BorderConfig, b: BorderConfig): boolean {
  return (
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.right === b.right &&
    a.enabled.top === b.enabled.top &&
    a.enabled.bottom === b.enabled.bottom &&
    a.enabled.left === b.enabled.left &&
    a.enabled.right === b.enabled.right
  )
}

/** 当前照片是否与某条预设定义完全一致（尺寸、旋转、边框、批注字号/颜色） */
export function photoMatchesPreset(photo: PhotoItem, preset: PresetTemplate): boolean {
  if (photo.template.name !== preset.templateName) return false
  if (photo.templateRotation !== preset.templateRotation) return false
  if (photo.borderColor !== preset.borderColor) return false
  if (!bordersEqual(photo.border, preset.border)) return false
  for (const ann of photo.annotations) {
    if (ann.fontSize !== preset.fontSize || ann.color !== preset.fontColor) return false
  }
  return true
}

/** 仅位置/文案变更不算偏离预设 */
export function annotationStyleFieldsChanged(partial: Partial<Annotation>): boolean {
  return (
    partial.fontSize !== undefined ||
    partial.color !== undefined ||
    partial.bold !== undefined ||
    partial.background !== undefined
  )
}
