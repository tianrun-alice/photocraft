import { BatchExportButton } from '@/components/BatchExportButton'
import { ControlPanel } from '@/components/ControlPanel'
import { ImageUploader } from '@/components/ImageUploader'
import { PhotoCanvas } from '@/components/PhotoCanvas'
import { PresetPanel } from '@/components/PresetPanel'

export function Editor() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">PhotoCraft</h1>
            <p className="text-xs text-gray-500">照片冲印批注工具</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4">
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

        <section className="flex-1 min-w-0">
          <PhotoCanvas />
        </section>

        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <ControlPanel />
          </div>
        </aside>
      </main>
    </div>
  )
}

