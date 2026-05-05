/** 列表点选换图时锁定视口滚动位置，在布局提交后写回（绕过滚动锚定、重排后的跳动） */
let armedY: number | null = null
let armedX: number | null = null
/** 浏览器 `window.setTimeout` 为 number；与 Node `Timeout` 类型并存时显式用 number 避免 tsc -b 报错 */
let armExpireTimer: number | null = null

export function armPhotoListScrollRestore() {
  armedX = window.scrollX
  armedY = window.scrollY
  if (armExpireTimer != null) window.clearTimeout(armExpireTimer)
  armExpireTimer = window.setTimeout(() => {
    armExpireTimer = null
    armedY = null
    armedX = null
  }, 1500)
}

export function consumePhotoListScrollRestore() {
  if (armedY === null) return
  if (armExpireTimer != null) {
    window.clearTimeout(armExpireTimer)
    armExpireTimer = null
  }
  const y = armedY
  const x = armedX ?? 0
  armedY = null
  armedX = null
  const apply = () => {
    if (window.scrollY !== y || window.scrollX !== x) {
      window.scrollTo(x, y)
    }
  }
  apply()
  requestAnimationFrame(apply)
  requestAnimationFrame(() => requestAnimationFrame(apply))
  window.setTimeout(apply, 0)
  window.setTimeout(apply, 32)
  window.setTimeout(apply, 120)
}
