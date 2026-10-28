import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(String(e)))

await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const alphaAt = (x, y) => page.evaluate(([x, y]) => {
  const c = document.querySelectorAll('.cursor-reveal__layer')[1]
  const d = c.getContext('2d').getImageData(x, y, 1, 1).data
  return d[3]
}, [x, y])

const maxAlpha = () => page.evaluate(() => {
  const c = document.querySelectorAll('.cursor-reveal__layer')[1]
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let m = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > m) m = d[i]
  return m
})

const box = await page.locator('.cursor-reveal').boundingBox()
const info = await page.evaluate(() => {
  const host = document.querySelector('.cursor-reveal')
  const [base, reveal] = document.querySelectorAll('.cursor-reveal__layer')
  const s = getComputedStyle(host)
  return {
    css: `${Math.round(host.getBoundingClientRect().width)}x${Math.round(host.getBoundingClientRect().height)}`,
    base: `${base.width}x${base.height}`,
    reveal: `${reveal.width}x${reveal.height}`,
    dpr: window.devicePixelRatio,
    aspect: s.aspectRatio,
    overflow: s.overflow,
    pointer: s.pointerEvents,
    role: host.getAttribute('role'),
    label: (host.getAttribute('aria-label') || '').slice(0, 30),
  }
})
console.log('sizes', JSON.stringify(info))

const cx = box.x + box.width / 2
const cy = box.y + box.height / 2
console.log('before hover: max alpha', await maxAlpha())

await page.mouse.move(cx, cy)
await page.waitForTimeout(200)
const centerDev = [Math.round((cx - box.x) * 2), Math.round((cy - box.y) * 2)]
console.log('hover centre alpha', await alphaAt(centerDev[0], centerDev[1]), 'max', await maxAlpha())

await page.mouse.move(cx + 120, cy, { steps: 8 })
await page.waitForTimeout(120)
const trailDev = [Math.round((cx - box.x) * 2), Math.round((cy - box.y) * 2)]
console.log('trail alpha at old point', await alphaAt(trailDev[0], trailDev[1]))

// still hovering, stay put: reveal should remain under the cursor
await page.waitForTimeout(1500)
console.log('after 1.5s idle hover, centre alpha', await alphaAt(centerDev[0] + 240, centerDev[1]), 'max', await maxAlpha())

await page.mouse.move(30, 30)
await page.waitForTimeout(300)
const fading = await maxAlpha()
await page.waitForTimeout(2200)
console.log('leave: 300ms max', fading, '-> 2.5s max', await maxAlpha())

await page.setViewportSize({ width: 1024, height: 800 })
await page.waitForTimeout(600)
const after = await page.evaluate(() => {
  const host = document.querySelector('.cursor-reveal')
  const [base, reveal] = document.querySelectorAll('.cursor-reveal__layer')
  const box = host.getBoundingClientRect()
  return {
    css: `${Math.round(box.width)}x${Math.round(box.height)}`,
    base: `${base.width}x${base.height}`,
    reveal: `${reveal.width}x${reveal.height}`,
    ratio: (box.width / box.height).toFixed(3),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
  }
})
console.log('after resize', JSON.stringify(after))

const shifts = await page.evaluate(() => new Promise(res => {
  const entries = []
  new PerformanceObserver(list => entries.push(...list.getEntries().map(e => e.value))).observe({ type: 'layout-shift', buffered: true })
  setTimeout(() => res(entries.reduce((a, b) => a + b, 0)), 300)
}))
console.log('CLS', shifts)
console.log('console errors', errors)
await browser.close()
