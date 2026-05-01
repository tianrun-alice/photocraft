# PhotoCraft — 前端实现（packages/web）

## 目录结构

```
packages/web/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
└── src/
    ├── main.tsx              # 应用入口
    ├── App.tsx               # 根组件
    ├── index.css             # TailwindCSS 入口
    ├── fabric.d.ts           # fabric v5 类型声明补丁
    ├── pages/
    │   └── Editor/
    │       └── index.tsx     # 唯一页面：编辑器页
    ├── components/
    │   ├── PresetPanel/      # 预设模板管理面板
    │   ├── ImageUploader/    # 图片上传列表
    │   ├── PhotoCanvas/      # 中央画布预览
    │   ├── ControlPanel/     # 右侧控制面板
    │   └── BatchExportButton/ # 批量导出按钮
    ├── store/
    │   └── editorStore.ts    # Zustand 全局状态
    └── utils/
        ├── unitConvert.ts    # mm ↔ px 单位换算
        └── exportCanvas.ts   # Fabric.js 导出逻辑
```

---

## 配置文件

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

路径别名 `@` → `./src`，全项目使用 `@/xxx` 替代相对路径。

### tailwind.config.js
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### postcss.config.js
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}
```

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>web</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### src/fabric.d.ts（类型声明补丁）
Fabric v5 以具名方式导出 `fabric` 对象，需要补充类型：
```ts
declare module 'fabric' {
  const fabric: {
    Canvas: any
    Image: any
    Rect: any
    IText: any
    Line: any
    StaticCanvas: any
  }
  export { fabric }
}
```

---

## 入口文件

### src/main.tsx
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### src/App.tsx
```tsx
import { Editor } from '@/pages/Editor'

function App() {
  return <Editor />
}

export default App
```

---

## 页面：Editor（src/pages/Editor/index.tsx）

整体布局为三栏：左侧面板（预设 + 图片列表 + 批量导出）、中间画布、右侧控制面板。

```tsx
export function Editor() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">PhotoCraft</h1>
            <p className="text-xs text-gray-500">照片冲印批注工具</p >
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4">
        {/* 左侧 w-52 */}
        <aside className="w-full lg:w-52 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-3 space-y-4">
            <PresetPanel />
            <div>
              <h2 className="font-medium text-gray-700 mb-2 text-sm">图片列表</h2>
              <ImageUploader />
            </div>
            <BatchExportButton />
          </div>
        </aside>

        {/* 中间弹性 */}
        <section className="flex-1 min-w-0">
          <PhotoCanvas />
        </section>

        {/* 右侧 w-64 */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <ControlPanel />
          </div>
        </aside>
      </main>
    </div>
  )
}
```

---

## 状态管理：editorStore（src/store/editorStore.ts）

使用 Zustand + immer 中间件，所有状态在内存中，刷新丢失。

### Store 状态字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `photos` | `PhotoItem[]` | 所有已上传的照片 |
| `selectedPhotoId` | `string \| null` | 当前选中照片 ID |
| `presets` | `PresetTemplate[]` | 用户保存的预设列表 |
| `selectedPresetId` | `string \| null` | 当前激活的预设 ID |

### Store Actions

| Action | 说明 |
|--------|------|
| `addPhoto(dataUrl)` | 新增照片，默认用 5寸模板；若有选中预设则应用预设；自动选中新照片 |
| `removePhoto(id)` | 删除照片，如删除的是当前选中则选中第一张 |
| `selectPhoto(id \| null)` | 切换当前选中照片 |
| `setTemplate(template)` | 切换尺寸模板；若无预设则重置边框为模板默认值 |
| `rotateTemplate()` | 循环旋转模板 0→90→180→270→0 |
| `selectPreset(id \| null)` | 切换预设（仅切换，不立即应用） |
| `applyPresetToPhoto()` | 将 selectedPreset 的边框/字号/颜色应用到 selectedPhoto |
| `saveCurrentAsPreset(name)` | 将当前照片的边框+批注字号/颜色保存为新预设 |
| `removePreset(id)` | 删除预设 |
| `setBorder(partial)` | 更新选中照片的边框配置（部分更新，支持 `enabled` 嵌套对象） |
| `setBorderColor(color)` | 更新选中照片的边框颜色 |
| `addAnnotation(text?)` | 新增批注，默认文字"双击编辑"；自动定位到底部边框中央 |
| `updateAnnotation(id, partial)` | 更新批注属性 |
| `removeAnnotation(id)` | 删除批注 |
| `rotateImage('left' \| 'right')` | 图片旋转 ±90° |
| `flipImage('x' \| 'y')` | 图片翻转 |
| `setImageScale(scale)` | 设置缩放比，clamp [0.1, 5] |
| `setImagePosition(x, y)` | 设置图片中心偏移（预览像素） |
| `clearAll()` | 清空全部照片 |

### addAnnotation 定位逻辑

```
// 字号优先用预设字号，其次用模板默认
fontSizeMm = preset?.fontSize ?? template.defaults.fontSize

// y 坐标：底边框存在时放在边框垂直中间，否则贴底留2mm
bottomBorderMm = border.enabled.bottom ? border.bottom : 0
y = bottomBorderMm > 0
  ? templateHeight - bottomBorderMm/2 - fontSizeMm/2
  : templateHeight - fontSizeMm - 2

// x 坐标：水平居中
x = templateWidth / 2
```

---

## 组件详解

### ImageUploader（src/components/ImageUploader/index.tsx）

**功能**：文件上传 + 照片缩略图列表

- 无照片时显示拖拽上传区（支持 `onDrop` + `onClick` 触发 file input）
- 有照片时显示 2列 Grid 缩略图，点击选中，最后一格为添加按钮
- 仅接受 `image/*` 类型，支持多选
- 读取文件为 DataURL，调用 `addPhoto(dataUrl)`

```
状态来源：useEditorStore(photos, selectedPhotoId, addPhoto, selectPhoto)
```

---

### PresetPanel（src/components/PresetPanel/index.tsx）

**功能**：管理预设模板

- 可折叠（标题点击展开/收起）
- 始终有一个"默认"选项（选中则 `selectedPresetId = null`）
- 点击预设：`selectPreset(id)` + 若有选中照片则 `applyPresetToPhoto()`
- "保存当前设置"：展示名称输入框，确认后 `saveCurrentAsPreset(name)` + `applyPresetToPhoto()`
- 预设摘要展示：底边宽 + 颜色描述 + 字号

```
状态来源：useEditorStore(presets, selectedPresetId, selectedPhotoId, selectPreset, applyPresetToPhoto, saveCurrentAsPreset, removePreset)
```

---

### PhotoCanvas（src/components/PhotoCanvas/index.tsx）

**功能**：照片编辑预览画布（纯 DOM，非 Canvas 元素）

#### 渲染尺寸计算

```ts
const PREVIEW_DPI = 96
const MAX_SIZE = 450   // 模板框最大边长（预览像素）
const PADDING = 40     // 模板框外边距（用于显示框外图片）

// 模板实际预览尺寸
let wMm = template.mm.width
let hMm = template.mm.height
// 若 templateRotation 为 90 或 270，宽高互换
if (rotation === 90 || rotation === 270) [wMm, hMm] = [hMm, wMm]

wPx = mmToPx(wMm, 96)
hPx = mmToPx(hMm, 96)
scale = Math.min(MAX_SIZE / Math.max(wPx, hPx), 1)

previewWidth  = Math.round(wPx * scale)
previewHeight = Math.round(hPx * scale)
containerW    = previewWidth  + PADDING * 2
containerH    = previewHeight + PADDING * 2
```

#### DOM 层次结构

```
<div>                               容器，监听鼠标事件 + 滚轮
  <div style="relative">           相对定位容器 (containerW × containerH)
    <img>                          框外半透明图片（opacity 0.3），切换按钮控制显示
    <div data-export-target="template-box">  模板框（overflow: hidden）
      <img>                        框内图片（正常显示）
      <div>上边框</div>
      <div>下边框</div>
      <div>左边框</div>
      <div>右边框</div>
    </div>
    <div>框线（2px solid #333）</div>
    <div>四角标记 ×4</div>
    {annotations.map(ann => (
      <div>                        批注（position: absolute，可拖拽）
        {isEditing ? <input> : text}
      </div>
    ))}
  </div>
  <div>缩放控制按钮（- 百分比数字 +）</div>
  <div>操作按钮（左转/右转/水平翻转/垂直翻转/显示框外）</div>
</div>
```

#### 图片变换

```css
transform: translate({imageX}px, {imageY}px)
           scale({imageScale})
           rotate({imageRotation}deg)
           scaleX({imageFlipX ? -1 : 1})
           scaleY({imageFlipY ? -1 : 1});
transform-origin: center center;
```

图片在容器中以 `translate(-50%, -50%)` 为初始定位，再叠加上述变换。

#### 图片初始填充

```ts
// 图片加载完成时（onLoad），计算让图片恰好填满模板框的缩放比
const imgRatio = imgNaturalWidth / imgNaturalHeight
const templateRatio = previewWidth / previewHeight
if (imgRatio > templateRatio) {
  initialScale = previewHeight / imgNaturalHeight
} else {
  initialScale = previewWidth / imgNaturalWidth
}
setImageScale(initialScale)
```

#### 交互事件

| 事件 | 行为 |
|------|------|
| `onMouseDown`（画布背景）| 开始拖拽图片，`setDragging(true)` |
| `onMouseMove` | 若拖拽中：更新 imageX/Y；若拖拽批注中：更新批注 x/y（转为 mm 增量） |
| `onMouseUp` / `onMouseLeave` | 结束拖拽 |
| `onWheel` | 滚轮缩放图片，delta ±0.05 |
| 批注 `onMouseDown` | 开始拖拽批注（stopPropagation） |
| 批注 `onDoubleClick` | 进入编辑态（显示 input） |
| 批注 input `onBlur` | 提交文字 |
| 批注 input `onKeyDown Enter` | 提交文字；`Escape` 取消编辑 |

---

### ControlPanel（src/components/ControlPanel/index.tsx）

**功能**：右侧控制面板，编辑当前照片的所有属性

包含以下区块：

1. **当前图片** — 显示 "删除" 按钮
2. **尺寸模板** — 3列 Grid 按钮（4寸/5寸/6寸），当前选中高亮；旋转按钮显示当前角度
3. **边框设置** — 颜色 Picker + 4个方向（上/下/左/右）各有 checkbox + range + 数值
4. **文字批注** — "添加文字" 按钮；批注列表每条含：文字输入、删除、字号（mm）、颜色 Picker、粗体 B、背景色
5. **导出按钮** — 调用 `exportCanvas(photo, 'jpeg')`

---

### BatchExportButton（src/components/BatchExportButton/index.tsx）

**功能**：批量导出所有照片为 ZIP

- 无照片时组件不渲染（`return null`）
- 导出中显示进度 `"导出中 {done}/{total}..."`
- 调用 `exportAllPhotos(photos, 'jpeg', 0.95, onProgress)`

---

## 工具函数

### unitConvert.ts

```ts
// mm → px（四舍五入）
export function mmToPx(mm: number, dpi: number = 96): number {
  return Math.round(mm * dpi / 25.4)
}

// px → mm
export function pxToMm(px: number, dpi: number = 96): number {
  return px * 25.4 / dpi
}

// 获取导出尺寸（300 DPI）
export function getExportDimensions(template, dpi = 300): { width; height }

// 获取预览尺寸（含缩放比）
export function getPreviewDimensions(template, maxWidth, maxHeight): { width; height; scale }
```

---

### exportCanvas.ts

导出使用 **Fabric.js** 在内存中渲染，然后用 `multiplier` 放大到 300 DPI。

#### 核心常量

```ts
const PREVIEW_DPI = 96    // 与 PhotoCanvas 完全一致
const MAX_SIZE = 450
const EXPORT_DPI = 300
const multiplier = EXPORT_DPI / PREVIEW_DPI  // ≈ 3.125
```

#### exportCanvas(photo, format, quality)

单张导出，直接下载文件：

```
1. 计算与预览完全相同的 previewWidth × previewHeight
2. 创建 HTMLCanvasElement
3. new fabric.Canvas(el, { backgroundColor: '#ffffff' })
4. fabric.Image.fromURL(photo.dataUrl, img => {
     img.set({
       scaleX/Y: photo.imageScale,
       left: previewWidth/2 + photo.imageX,
       top: previewHeight/2 + photo.imageY,
       originX: 'center', originY: 'center',
       angle: photo.imageRotation,
       flipX: photo.imageFlipX,
       flipY: photo.imageFlipY,
     })
     fCanvas.add(img)
     // 添加各方向边框矩形
     // 添加批注文字（含可选背景矩形）
     fCanvas.renderAll()
     dataUrl = fCanvas.toDataURL({ format, quality, multiplier })
     saveAs(dataUrl, filename)   // 用 file-saver 下载
   })
```

**文件名格式**：`photocraft-{模板名}-{旋转角度}deg-{timestamp}.{format}`

#### exportAllPhotos(photos, format, quality, onProgress)

批量导出，打包为 ZIP：

```
for each photo:
  dataUrl = await renderPhotoToDataUrl(photo, format, quality)
  base64 = dataUrl.split(',')[1]
  filename = '{index}-{模板名}-{角度}deg.{format}'   // index 3位补零
  zip.file(filename, base64, { base64: true })
  onProgress(i+1, total)

blob = await zip.generateAsync({ type: 'blob' })
saveAs(blob, 'photocraft-export-{timestamp}.zip')
```

#### 批注背景渲染逻辑

```ts
if (ann.background) {
  // 先创建不可见 IText 估算文字宽度
  const bgText = new fabric.IText(ann.text, { fontSize, fontWeight, visible: false })
  const textWidth = bgText.width || ann.text.length * fontSize * 0.6
  // 绘制带圆角的背景矩形
  fCanvas.add(new fabric.Rect({
    left: annXPx - textWidth/2 - bgPadding,
    top:  annYPx - bgPadding,
    width: textWidth + bgPadding*2,
    height: fontSize * 1.2 + bgPadding*2,
    fill: ann.background,
    opacity: 0.8,
    rx: fontSize * 0.08, ry: fontSize * 0.08,
  }))
}
// 再绘制文字
```