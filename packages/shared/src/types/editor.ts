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

export interface PresetTemplate {
  id: string
  name: string
  border: BorderConfig
  borderColor: string
  fontSize: number
  fontColor: string
}

export const BUILTIN_PRESETS: PresetTemplate[] = []

export interface PhotoItem {
  id: string
  dataUrl: string
  template: PhotoTemplate
  templateRotation: 0 | 90 | 180 | 270
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
