# PhotoCraft — 数据模型（packages/shared）

所有共享类型定义在 `packages/shared/src/types/editor.ts`，通过 `packages/shared/src/index.ts` 统一 re-export。

前端用 `import { ... } from '@photocraft/shared'` 引入。

---

## PhotoTemplate — 照片尺寸模板

```ts
export interface PhotoTemplate {
  name: string                    // 显示名称，如 "5寸"
  inches: { width: number; height: number }  // 英寸尺寸
  mm: { width: number; height: number }      // 毫米尺寸（计算用）
  defaults: {
    border: BorderConfig          // 该尺寸的默认边框配置
    borderColor: string           // 默认边框颜色（hex）
    fontSize: number              // 默认批注字号（mm）
    fontColor: string             // 默认批注颜色（hex）
  }
}
```

### 内置模板（PHOTO_TEMPLATES）

```ts
export const PHOTO_TEMPLATES: PhotoTemplate[] = [
  {
    name: '4寸',
    inches: { width: 4, height: 3 },
    mm: { width: 101.6, height: 76.2 },
    defaults: {
      border: { top: 0, bottom: 8, left: 0, right: 0,
                enabled: { top: false, bottom: true, left: false, right: false } },
      borderColor: '#ffffff',
      fontSize: 4,
      fontColor: '#333333'
    }
  },
  {
    name: '5寸',
    inches: { width: 5, height: 3.5 },
    mm: { width: 127, height: 88.9 },
    defaults: {
      border: { top: 0, bottom: 10, left: 0, right: 0,
                enabled: { top: false, bottom: true, left: false, right: false } },
      borderColor: '#ffffff',
      fontSize: 4.5,
      fontColor: '#333333'
    }
  },
  {
    name: '6寸',
    inches: { width: 6, height: 4 },
    mm: { width: 152.4, height: 101.6 },
    defaults: {
      border: { top: 0, bottom: 12, left: 0, right: 0,
                enabled: { top: false, bottom: true, left: false, right: false } },
      borderColor: '#ffffff',
      fontSize: 5,
      fontColor: '#333333'
    }
  },
]
```

> 新增尺寸时直接向 `PHOTO_TEMPLATES` 数组追加元素即可，UI 会自动渲染。

---

## BorderConfig — 边框配置

```ts
export interface BorderConfig {
  top: number       // 上边框宽度（mm）
  bottom: number    // 下边框宽度（mm）
  left: number      // 左边框宽度（mm）
  right: number     // 右边框宽度（mm）
  enabled: {
    top: boolean
    bottom: boolean
    left: boolean
    right: boolean
  }
}
```

边框宽度和启用状态独立控制，禁用时宽度值保留但不渲染。

---

## Annotation — 文字批注

```ts
export interface Annotation {
  id: string              // 唯一 ID，格式 "ann-{timestamp}"
  text: string            // 文字内容
  x: number              // mm 坐标，相对于模板框左上角，水平居中基准点
  y: number              // mm 坐标，相对于模板框左上角，文字顶部基准点
  fontSize: number        // 字号（mm）
  color: string           // 文字颜色（hex）
  bold: boolean           // 是否粗体
  background: string | null  // 背景颜色（hex），null 表示无背景
}
```

**坐标系说明**：`x` 是文字水平中心点的 mm 坐标，`y` 是文字顶部的 mm 坐标，均相对于模板框左上角。渲染时用 `originX: 'center', originY: 'top'`。

---

## PresetTemplate — 用户预设

```ts
export interface PresetTemplate {
  id: string        // 唯一 ID，格式 "preset-{timestamp}-{random}"
  name: string      // 用户自定义名称
  border: BorderConfig
  borderColor: string
  fontSize: number  // mm，应用给批注的字号
  fontColor: string // 应用给批注的颜色
}

export const BUILTIN_PRESETS: PresetTemplate[] = []  // 当前无内置预设
```

预设由用户手动保存，存储在内存（Zustand store）中，刷新页面后丢失。

---

## PhotoItem — 单张照片完整状态

```ts
export interface PhotoItem {
  id: string                          // 唯一 ID，格式 "photo-{timestamp}-{random}"
  dataUrl: string                     // 图片 base64 Data URL
  template: PhotoTemplate             // 当前选中的尺寸模板
  templateRotation: 0 | 90 | 180 | 270  // 模板旋转角度（顺时针）
  border: BorderConfig                // 当前边框配置
  borderColor: string                 // 边框颜色
  annotations: Annotation[]          // 文字批注列表
  imageRotation: number              // 图片旋转角度（度，可为负数）
  imageFlipX: boolean                 // 水平翻转
  imageFlipY: boolean                 // 垂直翻转
  imageScale: number                  // 图片缩放比（相对于预览框，初始由 getInitialFill 计算）
  imageX: number                      // 图片中心点 X 偏移（预览像素）
  imageY: number                      // 图片中心点 Y 偏移（预览像素）
}
```

**注意**：`imageScale` / `imageX` / `imageY` 是预览坐标系（96 DPI 渲染，最大 450px 边长）下的值，导出时直接复用，再乘以 `multiplier = 300/96` 放大到 300 DPI。

---

## shared 包配置文件

### packages/shared/package.json
```json
{
  "name": "@photocraft/shared",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

### packages/shared/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
```

### packages/shared/src/index.ts
```ts
export * from './types/editor'
```