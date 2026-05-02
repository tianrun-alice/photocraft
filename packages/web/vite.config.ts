import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * GitHub Pages：
 * - 项目站：https://<user>.github.io/<仓库名>/ → base 为 /<仓库名>/
 * - 用户/组织站：仓库名须为 <user>.github.io，站点在 https://<user>.github.io/ → base 为 /
 */
function pagesBase(): string {
  const raw = process.env.GITHUB_REPOSITORY
  if (!raw?.includes('/')) return '/'
  const [, repo] = raw.split('/')
  if (!repo) return '/'
  if (repo.endsWith('.github.io')) return '/'
  return `/${repo}/`
}

const base = pagesBase()

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
