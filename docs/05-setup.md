# PhotoCraft — 工程配置与从零复刻指南

## Monorepo 根目录配置

### package.json（根）

```json
{
  "name": "photocraft",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "dev:server": "pnpm --filter server start:dev",
    "build": "pnpm --filter web build && pnpm --filter server build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - packages/*

ignoredBuiltDependencies:
  - '@mongodb-js/zstd'
  - '@parcel/watcher'
  - '@prisma/engines'
  - '@sap/hana-client'
  - aws-crt
  - bcrypt
  - better-sqlite3
  - canvas
  - esbuild
  - kerberos
  - libpq
  - mongodb-client-encryption
  - msgpackr-extract
  - oracledb
  - prisma
  - sqlite3
  - unrs-resolver

onlyBuiltDependencies:
  - bcrypt
```

`ignoredBuiltDependencies` 禁止 pnpm 构建这些包的 native 模块（避免不必要的编译），`onlyBuiltDependencies` 仅允许 `bcrypt` 构建 native 模块。

---

## 各包 package.json

### packages/shared/package.json

```json
{
  "name": "@photocraft/shared",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

### packages/web/package.json

```json
{
  "name": "@photocraft/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@photocraft/shared": "workspace:*",
    "axios": "^1.6.0",
    "fabric": "^5.3.0",
    "file-saver": "^2.0.5",
    "html-to-image": "^1.11.13",
    "immer": "^10.0.0",
    "jszip": "^3.10.1",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/file-saver": "^2.0.7",
    "@types/jszip": "^3.4.1",
    "@types/node": "^24.12.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.58.0",
    "vite": "^8.0.4"
  }
}
```

### packages/server/package.json

```json
{
  "name": "@photocraft/server",
  "version": "1.0.0",
  "description": "PhotoCraft backend server",
  "main": "dist/src/main",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^11.1.19",
    "@nestjs/config": "^3.1.0",
    "@nestjs/core": "^11.1.19",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^11.1.19",
    "bcrypt": "^5.1.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "~0.2.2",
    "@photocraft/shared": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.21",
    "@nestjs/schematics": "^11.1.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/node": "^24.12.2",
    "@types/passport-jwt": "^4.0.0",
    "typescript": "^5.9.3"
  }
}
```

---

## 从零复刻步骤

### 1. 环境要求

- Node.js >= 20（推荐 LTS v22）
- pnpm >= 9（`npm install -g pnpm`）

### 2. 创建目录结构

```bash
mkdir photocraft && cd photocraft
mkdir -p packages/shared/src/types
mkdir -p packages/web/src/{pages/Editor,components/{PresetPanel,ImageUploader,PhotoCanvas,ControlPanel,BatchExportButton},store,utils,assets}
mkdir -p packages/web/public
mkdir -p packages/server/src/auth
```

### 3. 写入配置文件

按照本文档各章节内容，依次创建：

**根目录**：
- `package.json`
- `pnpm-workspace.yaml`
- `.gitignore`（忽略 `node_modules/`, `dist/`, `.env`）

**packages/shared/**：
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/types/editor.ts`（完整内容见 [02-data-model.md](./02-data-model.md)）

**packages/web/**：
- `package.json`
- `vite.config.ts`
- `tailwind.config.js`
- `postcss.config.js`
- `tsconfig.json`（内容：`{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }`）
- `tsconfig.app.json`
- `tsconfig.node.json`（内容见下方）
- `index.html`
- `src/index.css`
- `src/fabric.d.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/pages/Editor/index.tsx`
- `src/store/editorStore.ts`
- `src/utils/unitConvert.ts`
- `src/utils/exportCanvas.ts`
- `src/components/PresetPanel/index.tsx`
- `src/components/ImageUploader/index.tsx`
- `src/components/PhotoCanvas/index.tsx`
- `src/components/ControlPanel/index.tsx`
- `src/components/BatchExportButton/index.tsx`

**packages/server/**：
- `package.json`
- `nest-cli.json`
- `tsconfig.json`
- `tsconfig.build.json`
- `src/main.ts`
- `src/app.module.ts`
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/jwt.strategy.ts`
- `.env`（`JWT_SECRET=your-secret`）

### 4. 安装依赖并启动

```bash
# 在 photocraft/ 根目录
pnpm install

# 终端1：启动前端（http://localhost:5173）
pnpm dev

# 终端2：启动后端（http://localhost:3000）
pnpm dev:server
```

---

## tsconfig.node.json（web 包）

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "esnext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true
  },
  "include": ["vite.config.ts"]
}
```

## tsconfig.app.json（web 包）

```json
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0",
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

---

## 关键注意事项

1. **`@photocraft/shared` 引用**：`web` 中使用 `import { ... } from '@photocraft/shared'`，Vite 通过 pnpm workspace 直接解析到 `packages/shared/src/index.ts`，无需构建 shared 包。

2. **Fabric.js v5**：导入方式为 `import { fabric } from 'fabric'`（具名导出），需要 `src/fabric.d.ts` 类型声明补丁，否则 TypeScript 报错。

3. **坐标一致性**：`PhotoCanvas`（预览）和 `exportCanvas`（导出）使用完全相同的 `PREVIEW_DPI=96`、`MAX_SIZE=450` 常量计算模板框尺寸，导出时乘以 `multiplier=300/96` 放大，保证预览与导出一致。

4. **图片初始缩放**：`imageScale` 初始值不是 `1`，而是 `getInitialFill()` 计算的让图片恰好填满模板框的缩放比。`exportCanvas` 直接使用该值，因此坐标系完全匹配。

5. **bcrypt native 模块**：Windows 上需要 Visual C++ Build Tools 或通过 `npm install -g windows-build-tools` 安装构建工具，才能正确编译 bcrypt。