import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/** GitHub Pages 项目站：<user>.github.io/<仓库名>/ — CI 中会设置 GITHUB_REPOSITORY=owner/repo */
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = repo ? `/${repo}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
