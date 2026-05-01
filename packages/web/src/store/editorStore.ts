import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  type Annotation,
  type BorderConfig,
  BUILTIN_PRESETS,
  PHOTO_TEMPLATES,
  type PhotoItem,
  type PhotoTemplate,
  type PresetTemplate,
} from '@photocraft/shared'

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function cloneBorder(border: BorderConfig): BorderConfig {
  return {
    top: border.top,
    bottom: border.bottom,
    left: border.left,
    right: border.right,
    enabled: { ...border.enabled },
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export interface EditorState {
  photos: PhotoItem[]
  selectedPhotoId: string | null
  presets: PresetTemplate[]
  selectedPresetId: string | null

  addPhoto: (dataUrl: string) => void
  removePhoto: (id: string) => void
  selectPhoto: (id: string | null) => void

  setTemplate: (template: PhotoTemplate) => void
  rotateTemplate: () => void

  selectPreset: (id: string | null) => void
  applyPresetToPhoto: () => void
  saveCurrentAsPreset: (name: string) => void
  removePreset: (id: string) => void

  setBorder: (partial: Partial<BorderConfig> & { enabled?: Partial<BorderConfig['enabled']> }) => void
  setBorderColor: (color: string) => void

  addAnnotation: (text?: string) => void
  updateAnnotation: (id: string, partial: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void

  rotateImage: (dir: 'left' | 'right') => void
  flipImage: (axis: 'x' | 'y') => void
  setImageScale: (scale: number) => void
  setImagePosition: (x: number, y: number) => void

  clearAll: () => void
}

function getSelectedPhoto(state: EditorState): PhotoItem | null {
  if (!state.selectedPhotoId) return null
  return state.photos.find((p) => p.id === state.selectedPhotoId) ?? null
}

function getSelectedPreset(state: EditorState): PresetTemplate | null {
  if (!state.selectedPresetId) return null
  return state.presets.find((p) => p.id === state.selectedPresetId) ?? null
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    photos: [],
    selectedPhotoId: null,
    presets: [...BUILTIN_PRESETS],
    selectedPresetId: null,

    addPhoto: (dataUrl) => {
      set((s) => {
        const template = PHOTO_TEMPLATES.find((t) => t.name === '5寸') ?? PHOTO_TEMPLATES[0]
        const preset = getSelectedPreset(s as EditorState)

        const border = cloneBorder(preset?.border ?? template.defaults.border)
        const borderColor = preset?.borderColor ?? template.defaults.borderColor

        const newPhoto: PhotoItem = {
          id: makeId('photo'),
          dataUrl,
          template,
          templateRotation: 0,
          border,
          borderColor,
          annotations: [],
          imageRotation: 0,
          imageFlipX: false,
          imageFlipY: false,
          imageScale: 1,
          imageX: 0,
          imageY: 0,
        }

        s.photos.push(newPhoto)
        s.selectedPhotoId = newPhoto.id
      })
    },

    removePhoto: (id) => {
      set((s) => {
        const idx = s.photos.findIndex((p) => p.id === id)
        if (idx === -1) return
        s.photos.splice(idx, 1)
        if (s.selectedPhotoId === id) {
          s.selectedPhotoId = s.photos[0]?.id ?? null
        }
      })
    },

    selectPhoto: (id) => {
      set((s) => {
        s.selectedPhotoId = id
      })
    },

    setTemplate: (template) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        photo.template = template

        const preset = getSelectedPreset(s as EditorState)
        if (!preset) {
          photo.border = cloneBorder(template.defaults.border)
          photo.borderColor = template.defaults.borderColor
        }
      })
    },

    rotateTemplate: () => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        const order: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270]
        const idx = order.indexOf(photo.templateRotation)
        photo.templateRotation = order[(idx + 1) % order.length]
      })
    },

    selectPreset: (id) => {
      set((s) => {
        s.selectedPresetId = id
      })
    },

    applyPresetToPhoto: () => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        const preset = getSelectedPreset(s as EditorState)
        if (!photo || !preset) return
        photo.border = cloneBorder(preset.border)
        photo.borderColor = preset.borderColor

        for (const ann of photo.annotations) {
          ann.fontSize = preset.fontSize
          ann.color = preset.fontColor
        }
      })
    },

    saveCurrentAsPreset: (name) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return

        const preset: PresetTemplate = {
          id: makeId('preset'),
          name: name.trim() || '未命名预设',
          border: cloneBorder(photo.border),
          borderColor: photo.borderColor,
          fontSize: photo.template.defaults.fontSize,
          fontColor: photo.template.defaults.fontColor,
        }

        s.presets.unshift(preset)
        s.selectedPresetId = preset.id
      })

      get().applyPresetToPhoto()
    },

    removePreset: (id) => {
      set((s) => {
        const idx = s.presets.findIndex((p) => p.id === id)
        if (idx === -1) return
        s.presets.splice(idx, 1)
        if (s.selectedPresetId === id) s.selectedPresetId = null
      })
    },

    setBorder: (partial) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        Object.assign(photo.border, partial)
        if (partial.enabled) {
          Object.assign(photo.border.enabled, partial.enabled)
        }
      })
    },

    setBorderColor: (color) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        photo.borderColor = color
      })
    },

    addAnnotation: (text) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return

        const preset = getSelectedPreset(s as EditorState)
        const fontSizeMm = preset?.fontSize ?? photo.template.defaults.fontSize
        const color = preset?.fontColor ?? photo.template.defaults.fontColor

        const templateWidth = photo.template.mm.width
        const templateHeight = photo.template.mm.height

        const bottomBorderMm = photo.border.enabled.bottom ? photo.border.bottom : 0
        const y =
          bottomBorderMm > 0
            ? templateHeight - bottomBorderMm / 2 - fontSizeMm / 2
            : templateHeight - fontSizeMm - 2

        const ann: Annotation = {
          id: `ann-${Date.now()}`,
          text: text ?? '双击编辑',
          x: templateWidth / 2,
          y,
          fontSize: fontSizeMm,
          color,
          bold: false,
          background: null,
        }
        photo.annotations.push(ann)
      })
    },

    updateAnnotation: (id, partial) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        const ann = photo.annotations.find((a) => a.id === id)
        if (!ann) return
        Object.assign(ann, partial)
      })
    },

    removeAnnotation: (id) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        const idx = photo.annotations.findIndex((a) => a.id === id)
        if (idx === -1) return
        photo.annotations.splice(idx, 1)
      })
    },

    rotateImage: (dir) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        photo.imageRotation += dir === 'left' ? -90 : 90
      })
    },

    flipImage: (axis) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        if (axis === 'x') photo.imageFlipX = !photo.imageFlipX
        if (axis === 'y') photo.imageFlipY = !photo.imageFlipY
      })
    },

    setImageScale: (scale) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        photo.imageScale = clamp(scale, 0.01, 5)
      })
    },

    setImagePosition: (x, y) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        photo.imageX = x
        photo.imageY = y
      })
    },

    clearAll: () => {
      set((s) => {
        s.photos = []
        s.selectedPhotoId = null
      })
    },
  })),
)

