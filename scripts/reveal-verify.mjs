import { chromium } from 'playwright'

const browser = await chromium.launch()

const profile = async (page) => page.evaluate(() => {
  const reveal = document.querySelectorAll('.cursor-reveal__layer')[1]
  const ctx = reveal.getContext('2d')
  const d = ctx.getImageData(0, 0, reveal.width, reveal.height).data
  const cx = reveal.width / 2
  const cy = reveal.height / 2
  const bands = Array.from({ length: 12 }, () => [])
  for (let y = 0; y < reveal.height; y += 4) {
    for (let x = 0; x < reveal.width; x += 4) {
      const a = d[(y * reveal.width + x) * 4 + 3]
      const r = Math.hypot(x - cx, y - cy)
      const band = Math.min(11, Math.floor(r / 60))
      bands[band].push(a)
    }
  }
  return bands.map((v, i) => ({ r: `${i * 60}-${i * 60 + 59}`, max: Math.max(0, ...v), avg: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) }))
})

const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION_REFUSED')) errors.push(m.text()) })
await page.goto('http://localhost:5180/', { waitUntil: 'load' })
await page.waitForTimeout(2500)

const box = await page.locator('.cursor-reveal').boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.waitForTimeout(300)
console.log('radial profile while hovered:', JSON.stringify((await profile(page)).filter(b => b.max > 0)))

// leave and wait for fade
await page.mouse.move(20, 20)
await page.waitForTimeout(4000)
console.log('after leave 4s:', JSON.stringify((await profile(page)).filter(b => b.max > 0)))

// resize: wrapper must follow container, canvases must follow dpr
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(600)
const small = await page.evaluate(() => {
  const host = document.querySelector('.cursor-reveal')
  const [base, reveal] = document.querySelectorAll('.cursor-reveal__layer')
  const r = host.getBoundingClientRect()
  return {
    css: `${r.width.toFixed(1)}x${r.height.toFixed(1)}`,
    base: `${base.width}x${base.height}`,
    reveal: `${reveal.width}x${reveal.height}`,
    ratio: +(r.width / r.height).toFixed(4),
    expected: +(839 / 713).toFixed(4),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    touchAction: getComputedStyle(host).touchAction,
  }
})
console.log('mobile 390:', JSON.stringify(small))

// touch reveal: synthesize a touch pointer sequence
await page.evaluate(() => {
  const host = document.querySelector('.cursor-reveal')
  const r = host.getBoundingClientRect()
  host.dispatchEvent(new PointerEvent('pointermove', {
    pointerType: 'touch', pointerId: 7, bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
  }))
})
await page.waitForTimeout(300)
const touch = await page.evaluate(() => {
  const reveal = document.querySelectorAll('.cursor-reveal__layer')[1]
  const d = reveal.getContext('2d').getImageData(0, 0, reveal.width, reveal.height).data
  let m = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > m) m = d[i]
  return m
})
console.log('touch reveal max alpha:', touch)

await page.evaluate(() => {
  document.querySelector('.cursor-reveal').dispatchEvent(new PointerEvent('pointercancel', { pointerType: 'touch', pointerId: 7, bubbles: true }))
})
await page.waitForTimeout(4000)
const afterCancel = await page.evaluate(() => {
  const reveal = document.querySelectorAll('.cursor-reveal__layer')[1]
  const d = reveal.getContext('2d').getImageData(0, 0, reveal.width, reveal.height).data
  let m = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > m) m = d[i]
  return m
})
console.log('after pointercancel max alpha:', afterCancel)

// reduced motion: trail must not linger
const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
await rm.goto('http://localhost:5180/', { waitUntil: 'load' })
await rm.waitForTimeout(2500)
const rbox = await rm.locator('.cursor-reveal').boundingBox()
await rm.mouse.move(rbox.x + rbox.width * 0.4, rbox.y + rbox.height * 0.5, { steps: 10 })
await rm.waitForTimeout(250)
const rmHover = await rm.evaluate(() => {
  const reveal = document.querySelectorAll('.cursor-reveal__layer')[1]
  const d = reveal.getContext('2d').getImageData(0, 0, reveal.width, reveal.height).data
  let m = 0, n = 0
  for (let i = 3; i < d.length; i += 4) { if (d[i] > m) m = d[i]; if (d[i] > 0) n++ }
  return { max: m, nonZero: n, total: d.length / 4 }
})
await rm.mouse.move(20, 20)
await rm.waitForTimeout(400)
const rmLeft = await rm.evaluate(() => {
  const reveal = document.querySelectorAll('.cursor-reveal__layer')[1]
  const d = reveal.getContext('2d').getImageData(0, 0, reveal.width, reveal.height).data
  let m = 0, n = 0
  for (let i = 3; i < d.length; i += 4) { if (d[i] > m) m = d[i]; if (d[i] > 0) n++ }
  return { max: m, nonZero: n }
})
console.log('reduced-motion hover:', JSON.stringify(rmHover), 'after leave 400ms:', JSON.stringify(rmLeft))

console.log('errors:', errors)
await browser.close()
