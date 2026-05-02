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
import {
  getRotatedTemplateMm,
  remapAnnotationMmForRotationChange,
  remapAnnotationMmInDisplayFrame,
} from '@/utils/unitConvert'
import { annotationStyleFieldsChanged, photoMatchesPreset } from '@/utils/presetMatch'

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

function findTemplateByName(name: string): PhotoTemplate {
  return PHOTO_TEMPLATES.find((t) => t.name === name) ?? PHOTO_TEMPLATES[0]
}

function getAnchoredPreset(photo: PhotoItem, state: EditorState): PresetTemplate | null {
  if (!photo.appliedPresetId) return null
  return state.presets.find((p) => p.id === photo.appliedPresetId) ?? null
}

/** 若当前套用预设与照片实际不一致，则解除套用并同步侧栏选中 */
function syncAnchoredPreset(s: EditorState, photo: PhotoItem) {
  const aid = photo.appliedPresetId
  if (!aid) return
  const preset = s.presets.find((p) => p.id === aid)
  if (!preset || !photoMatchesPreset(photo, preset)) {
    photo.appliedPresetId = null
    if (s.selectedPhotoId === photo.id) {
      s.selectedPresetId = null
    }
  }
}

/** 将预设中的尺寸、旋转、边框、字号应用到照片（含批注坐标与样式） */
function applyPresetToPhotoDraft(photo: PhotoItem, preset: PresetTemplate) {
  const { widthMm: w0, heightMm: h0 } = getRotatedTemplateMm(photo.template, photo.templateRotation)

  photo.template = findTemplateByName(preset.templateName)
  photo.templateRotation = preset.templateRotation
  photo.border = cloneBorder(preset.border)
  photo.borderColor = preset.borderColor

  const { widthMm: w1, heightMm: h1 } = getRotatedTemplateMm(photo.template, photo.templateRotation)
  for (const ann of photo.annotations) {
    const next = remapAnnotationMmInDisplayFrame(ann.x, ann.y, ann.fontSize, w0, h0, w1, h1)
    ann.x = next.x
    ann.y = next.y
    ann.fontSize = preset.fontSize
    ann.color = preset.fontColor
  }
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

  setBorder: (partial: Omit<Partial<BorderConfig>, 'enabled'> & { enabled?: Partial<BorderConfig['enabled']> }) => void
  setBorderColor: (color: string) => void

  addAnnotation: (text?: string) => void
  updateAnnotation: (id: string, partial: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void

  rotateImage: (dir: 'left' | 'right') => void
  flipImage: (axis: 'x' | 'y') => void
  setImageScale: (photoId: string, scale: number) => void
  setImagePosition: (photoId: string, x: number, y: number) => void

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
        const border = cloneBorder(template.defaults.border)
        const borderColor = template.defaults.borderColor

        const newPhoto: PhotoItem = {
          id: makeId('photo'),
          dataUrl,
          template,
          templateRotation: 0,
          appliedPresetId: null,
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
        s.selectedPresetId = null
      })
    },

    removePhoto: (id) => {
      set((s) => {
        const idx = s.photos.findIndex((p) => p.id === id)
        if (idx === -1) return
        s.photos.splice(idx, 1)
        if (s.selectedPhotoId === id) {
          s.selectedPhotoId = s.photos[0]?.id ?? null
          const next = s.photos[0] ?? null
          s.selectedPresetId = next?.appliedPresetId ?? null
        }
      })
    },

    selectPhoto: (id) => {
      set((s) => {
        s.selectedPhotoId = id
        if (!id) {
          s.selectedPresetId = null
          return
        }
        const ph = s.photos.find((p) => p.id === id) ?? null
        s.selectedPresetId = ph?.appliedPresetId ?? null
      })
    },

    setTemplate: (template) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        const rot = photo.templateRotation
        const { widthMm: w0, heightMm: h0 } = getRotatedTemplateMm(photo.template, rot)

        photo.template = template
        const { widthMm: w1, heightMm: h1 } = getRotatedTemplateMm(photo.template, rot)

        for (const ann of photo.annotations) {
          const next = remapAnnotationMmInDisplayFrame(ann.x, ann.y, ann.fontSize, w0, h0, w1, h1)
          ann.x = next.x
          ann.y = next.y
        }

        syncAnchoredPreset(s as EditorState, photo)
        if (!photo.appliedPresetId) {
          photo.border = cloneBorder(photo.template.defaults.border)
          photo.borderColor = photo.template.defaults.borderColor
        }
      })
    },

    rotateTemplate: () => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        const order: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270]
        const idx = order.indexOf(photo.templateRotation)
        const oldRot = photo.templateRotation
        const newRot = order[(idx + 1) % order.length]
        const tpl = photo.template

        for (const ann of photo.annotations) {
          const next = remapAnnotationMmForRotationChange(ann.x, ann.y, ann.fontSize, oldRot, newRot, tpl)
          ann.x = next.x
          ann.y = next.y
        }

        photo.templateRotation = newRot
        syncAnchoredPreset(s as EditorState, photo)
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
        if (!photo) return
        const preset = getSelectedPreset(s as EditorState)
        if (!preset) {
          photo.appliedPresetId = null
          return
        }
        applyPresetToPhotoDraft(photo, preset)
        photo.appliedPresetId = preset.id
      })
    },

    saveCurrentAsPreset: (name) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return

        const sel = getSelectedPreset(s as EditorState)
        const preset: PresetTemplate = {
          id: makeId('preset'),
          name: name.trim() || '未命名预设',
          templateName: photo.template.name,
          templateRotation: photo.templateRotation,
          border: cloneBorder(photo.border),
          borderColor: photo.borderColor,
          fontSize: sel?.fontSize ?? photo.annotations[0]?.fontSize ?? photo.template.defaults.fontSize,
          fontColor: sel?.fontColor ?? photo.annotations[0]?.color ?? photo.template.defaults.fontColor,
        }

        s.presets.unshift(preset)
        s.selectedPresetId = preset.id
        photo.appliedPresetId = preset.id
      })

      get().applyPresetToPhoto()
    },

    removePreset: (id) => {
      set((s) => {
        const idx = s.presets.findIndex((p) => p.id === id)
        if (idx === -1) return
        if (s.presets[idx].builtin) return
        s.presets.splice(idx, 1)
        if (s.selectedPresetId === id) s.selectedPresetId = null
        for (const ph of s.photos) {
          if (ph.appliedPresetId === id) ph.appliedPresetId = null
        }
      })
    },

    setBorder: (partial) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        const { enabled: enabledPart, ...rest } = partial
        if (Object.keys(rest).length > 0) {
          Object.assign(photo.border, rest)
        }
        if (enabledPart) {
          Object.assign(photo.border.enabled, enabledPart)
        }
        syncAnchoredPreset(s as EditorState, photo)
      })
    },

    setBorderColor: (color) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return
        photo.borderColor = color
        syncAnchoredPreset(s as EditorState, photo)
      })
    },

    addAnnotation: (text) => {
      set((s) => {
        const photo = getSelectedPhoto(s as EditorState)
        if (!photo) return

        const anchored = getAnchoredPreset(photo, s as EditorState)
        const fontSizeMm = anchored?.fontSize ?? photo.template.defaults.fontSize
        const color = anchored?.fontColor ?? photo.template.defaults.fontColor

        const { widthMm, heightMm } = getRotatedTemplateMm(photo.template, photo.templateRotation)

        const bottomBorderMm = photo.border.enabled.bottom ? photo.border.bottom : 0
        // ann.y 为文字顶部（与画布 originY: top 一致）。底边框带垂直中线 ≈ heightMm - bottomBorderMm/2；
        // 用略大于半字号的偏移使字形在色带内视觉居中，避免贴底偏下。
        const y =
          bottomBorderMm > 0
            ? heightMm - bottomBorderMm / 2 - fontSizeMm * 0.65
            : heightMm - fontSizeMm * 2.75 - 6

        const ann: Annotation = {
          id: `ann-${Date.now()}`,
          text: text ?? '在文本框中编辑文字',
          x: widthMm / 2,
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
        if (annotationStyleFieldsChanged(partial)) {
          syncAnchoredPreset(s as EditorState, photo)
        }
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

    setImageScale: (photoId, scale) => {
      set((s) => {
        const photo = s.photos.find((ph) => ph.id === photoId)
        if (!photo) return
        photo.imageScale = clamp(scale, 0.01, 5)
      })
    },

    setImagePosition: (photoId, x, y) => {
      set((s) => {
        const photo = s.photos.find((ph) => ph.id === photoId)
        if (!photo) return
        photo.imageX = x
        photo.imageY = y
      })
    },

    clearAll: () => {
      set((s) => {
        s.photos = []
        s.selectedPhotoId = null
        s.selectedPresetId = null
      })
    },
  })),
)

