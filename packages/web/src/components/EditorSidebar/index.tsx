import { useEffect, useId, useState, type ReactNode } from 'react'
import { BatchExportButton } from '@/components/BatchExportButton'
import { ImageUploader } from '@/components/ImageUploader'
import { PresetPanel } from '@/components/PresetPanel'
import { useEditorStore } from '@/store/editorStore'

function useMediaLgUp() {
  const [lg, setLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setLg(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return lg
}

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={[className, 'shrink-0 text-emerald-700/70 transition-transform duration-200', open ? 'rotate-180' : ''].join(
        ' ',
      )}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function MobileFold(props: {
  title: string
  hint?: string
  defaultOpen: boolean
  badge?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(props.defaultOpen)
  const panelId = useId()

  return (
    <div className="rounded-lg border border-emerald-100 bg-white/90 shadow-sm shadow-emerald-900/[0.03]">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left active:bg-emerald-50/60"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">{props.title}</span>
          {props.hint ? <span className="text-[10px] font-normal normal-case leading-snug text-emerald-600/85">{props.hint}</span> : null}
        </span>
        {props.badge ? (
          <span className="shrink-0 rounded-full bg-emerald-600/12 px-2 py-0.5 text-[11px] font-medium tabular-nums text-emerald-900">
            {props.badge}
          </span>
        ) : null}
        <Chevron open={open} />
      </button>
      {open ? (
        <div id={panelId} className="border-t border-emerald-100/90 px-2 pb-3 pt-1 sm:px-3">
          {props.children}
        </div>
      ) : null}
    </div>
  )
}

export function EditorSidebar() {
  const isLg = useMediaLgUp()
  const photoCount = useEditorStore((s) => s.photos.length)

  if (isLg) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4">
        <div className="shrink-0">
          <PresetPanel />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-emerald-700/90">图片列表</h2>
          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch]"
            style={{ overflowAnchor: 'none' }}
          >
            <ImageUploader />
          </div>
        </div>
        <div className="shrink-0">
          <BatchExportButton />
        </div>
      </div>
    )
  }

  const imageBadge = photoCount > 0 ? `${photoCount} 张` : '未上传'

  return (
    <div className="flex flex-col gap-2 sm:gap-2.5">
      <div className="rounded-lg border border-emerald-100 bg-white/90 px-2 py-2 shadow-sm shadow-emerald-900/[0.03] sm:px-3">
        <PresetPanel />
      </div>
      <MobileFold title="图片列表" hint="上传、切换当前编辑的照片" defaultOpen badge={imageBadge}>
        <div
          className="max-h-[min(52vh,22rem)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch]"
          style={{ overflowAnchor: 'none' }}
        >
          <ImageUploader />
        </div>
        <div className="mt-2 shrink-0">
          <BatchExportButton />
        </div>
      </MobileFold>
    </div>
  )
}
