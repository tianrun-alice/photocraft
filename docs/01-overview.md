# PhotoCraft — 项目概述

## 项目简介

PhotoCraft 是一个**照片冲印批注工具**，运行在浏览器中，允许用户上传照片、选择冲印尺寸模板（4寸/5寸/6寸）、添加白边/边框、写入文字批注，最终导出高分辨率（300 DPI）JPEG/PNG 图片，支持批量打包下载。

## 仓库结构

```
photocraft/                    # monorepo 根目录
├── package.json               # 根脚本（pnpm workspace）
├── pnpm-workspace.yaml        # workspace 配置
├── pnpm-lock.yaml
└── packages/
    ├── shared/                # 共享类型与常量（被 web/server 引用）
    ├── web/                   # React 前端（Vite）
    └── server/                # NestJS 后端（当前仅实现 Auth 模块）
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | TailwindCSS 3 |
| 状态管理 | Zustand 4 + immer |
| 画布渲染/导出 | Fabric.js 5 |
| 文件下载 | file-saver + JSZip |
| 包管理 | pnpm（workspace monorepo）|
| 后端框架 | NestJS 11 |
| 认证 | JWT（passport-jwt）+ bcrypt |

## 根脚本

```json
{
  "scripts": {
    "dev": "pnpm --filter web dev",
    "dev:server": "pnpm --filter server start:dev",
    "build": "pnpm --filter web build && pnpm --filter server build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

## 核心功能流程

```
用户上传图片
  → 选择照片尺寸模板（4寸 / 5寸 / 6寸，可旋转方向）
  → 拖拽/缩放图片在模板框内定位
  → 配置边框（上/下/左/右，mm 宽度 + 颜色）
  → 添加文字批注（可拖拽定位，双击编辑，设置字号/颜色/粗体/背景）
  → 保存为预设模板（可批量应用）
  → 单张导出 JPEG/PNG（300 DPI）
  → 批量导出全部照片为 ZIP 压缩包
```

## 包之间的依赖关系

```
packages/shared  ←── packages/web
packages/shared  ←── packages/server（预留，目前 server 未引用 shared 类型）
```

`shared` 包以 `workspace:*` 协议引用，无需发布到 npm。