import { ControlPanel } from '@/components/ControlPanel'
import { EditorSidebar } from '@/components/EditorSidebar'
import { PhotoCanvas } from '@/components/PhotoCanvas'

export function Editor() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-emerald-50/90 to-teal-50/50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-sm px-4 py-3 shadow-sm shadow-emerald-100/50 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-emerald-900 sm:text-lg">PhotoCraft</h1>
            <p className="text-[11px] text-emerald-700/80 mt-0.5 sm:text-xs">照片冲印批注工具</p>
          </div>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto flex flex-col gap-3 px-2 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-stretch lg:gap-6 lg:px-6 lg:py-6"
        style={{ overflowAnchor: 'none' }}
      >
        <aside className="order-3 w-full flex-shrink-0 lg:order-1 lg:flex lg:w-56 lg:min-h-0 lg:flex-col">
          <div className="pc-panel flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-3.5 lg:max-h-[calc(100vh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)]">
            <EditorSidebar />
          </div>
        </aside>

        <section className="order-1 min-w-0 w-full max-lg:flex-none lg:flex-1 lg:order-2">
          <PhotoCanvas />
        </section>

        <aside className="order-2 w-full flex-shrink-0 lg:order-3 lg:w-72">
          <div className="pc-panel p-2 sm:p-2.5 lg:p-3.5">
            <ControlPanel />
          </div>
        </aside>
      </main>
    </div>
  )
}


