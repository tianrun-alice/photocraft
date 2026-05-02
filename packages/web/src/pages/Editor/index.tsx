import { BatchExportButton } from '@/components/BatchExportButton'
import { ControlPanel } from '@/components/ControlPanel'
import { ImageUploader } from '@/components/ImageUploader'
import { PhotoCanvas } from '@/components/PhotoCanvas'
import { PresetPanel } from '@/components/PresetPanel'

export function Editor() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/90 to-teal-50/50">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-sm px-6 py-3.5 shadow-sm shadow-emerald-100/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-emerald-900">PhotoCraft</h1>
            <p className="text-xs text-emerald-700/80 mt-0.5">照片冲印批注工具</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4 lg:p-6">
        <aside className="w-full lg:w-56 flex-shrink-0">
          <div className="pc-panel flex max-h-[calc(100vh-7rem)] min-h-0 flex-col gap-4 overflow-hidden p-3.5 lg:max-h-[calc(100vh-5.5rem)]">
            <div className="shrink-0">
              <PresetPanel />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
              <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-emerald-700/90">图片列表</h2>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch]">
                <ImageUploader />
              </div>
            </div>
            <div className="shrink-0">
              <BatchExportButton />
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <PhotoCanvas />
        </section>

        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="pc-panel p-3.5">
            <ControlPanel />
          </div>
        </aside>
      </main>
    </div>
  )
}


