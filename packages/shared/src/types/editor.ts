export interface BorderConfig {
  top: number
  bottom: number
  left: number
  right: number
  enabled: {
    top: boolean
    bottom: boolean
    left: boolean
    right: boolean
  }
}

export interface PhotoTemplate {
  name: string
  inches: { width: number; height: number }
  mm: { width: number; height: number }
  defaults: {
    border: BorderConfig
    borderColor: string
    fontSize: number
    fontColor: string
  }
}

export const PHOTO_TEMPLATES: PhotoTemplate[] = [
  {
    name: '4寸',
    inches: { width: 4, height: 3 },
    mm: { width: 101.6, height: 76.2 },
    defaults: {
      border: {
        top: 0,
        bottom: 8,
        left: 0,
        right: 0,
        enabled: { top: false, bottom: true, left: false, right: false },
      },
      borderColor: '#ffffff',
      fontSize: 4,
      fontColor: '#333333',
    },
  },
  {
    name: '5寸',
    inches: { width: 5, height: 3.5 },
    mm: { width: 127, height: 88.9 },
    defaults: {
      border: {
        top: 0,
        bottom: 10,
        left: 0,
        right: 0,
        enabled: { top: false, bottom: true, left: false, right: false },
      },
      borderColor: '#ffffff',
      fontSize: 4.5,
      fontColor: '#333333',
    },
  },
  {
    name: '6寸',
    inches: { width: 6, height: 4 },
    mm: { width: 152.4, height: 101.6 },
    defaults: {
      border: {
        top: 0,
        bottom: 12,
        left: 0,
        right: 0,
        enabled: { top: false, bottom: true, left: false, right: false },
      },
      borderColor: '#ffffff',
      fontSize: 5,
      fontColor: '#333333',
    },
  },
]

export interface Annotation {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  bold: boolean
  background: string | null
}

export type TemplateRotation = 0 | 90 | 180 | 270

/** 用户预设或系统内置；含尺寸名、旋转角、边框与默认批注字号/颜色 */
export interface PresetTemplate {
  id: string
  name: string
  /** 对应 PHOTO_TEMPLATES 的 name，如 4寸 / 5寸 / 6寸 */
  templateName: string
  templateRotation: TemplateRotation
  border: BorderConfig
  borderColor: string
  fontSize: number
  fontColor: string
  /** 系统内置三条尺寸预设，不可删除 */
  builtin?: boolean
}

function cloneBorderConfig(b: BorderConfig): BorderConfig {
  return {
    top: b.top,
    bottom: b.bottom,
    left: b.left,
    right: b.right,
    enabled: { ...b.enabled },
  }
}

/** 三个尺寸各一条，边框与字号取自各模板 defaults */
export const BUILTIN_PRESETS: PresetTemplate[] = PHOTO_TEMPLATES.map((t) => ({
  id: `builtin-${t.name}`,
  name: `系统·${t.name}`,
  builtin: true,
  templateName: t.name,
  templateRotation: 0 as TemplateRotation,
  border: cloneBorderConfig(t.defaults.border),
  borderColor: t.defaults.borderColor,
  fontSize: t.defaults.fontSize,
  fontColor: t.defaults.fontColor,
}))

export interface PhotoItem {
  id: string
  dataUrl: string
  template: PhotoTemplate
  templateRotation: 0 | 90 | 180 | 270
  /** 当前照片套用的预设 id；null 表示未套用或与预设已不一致 */
  appliedPresetId: string | null
  border: BorderConfig
  borderColor: string
  annotations: Annotation[]
  imageRotation: number
  imageFlipX: boolean
  imageFlipY: boolean
  imageScale: number
  imageX: number
  imageY: number
}
