import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5180/', { waitUntil: 'load' })
await page.waitForTimeout(3000)

const shifts = await page.evaluate(() => new Promise(res => {
  const out = []
  const po = new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      out.push({
        value: +e.value.toFixed(4),
        time: Math.round(e.startTime),
        sources: (e.sources || []).map(s => s.node ? `${s.node.nodeName}.${s.node.className || ''}`.slice(0, 60) : 'n/a'),
      })
    }
  })
  po.observe({ type: 'layout-shift', buffered: true })
  setTimeout(() => { po.disconnect(); res(out) }, 400)
}))
console.log('shifts', JSON.stringify(shifts, null, 1))

const box = await page.locator('.cursor-reveal').boundingBox()
const clip = { x: box.x, y: box.y, width: box.width, height: box.height }
const before = await page.screenshot({ clip })
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, { steps: 6 })
await page.waitForTimeout(250)
const after = await page.screenshot({ clip })
await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.35, { steps: 10 })
await page.waitForTimeout(120)
const trail = await page.screenshot({ clip })

const fs = await import('node:fs')
const dir = process.env.TEMP
fs.writeFileSync(`${dir}/cr-before.png`, before)
fs.writeFileSync(`${dir}/cr-hover.png`, after)
fs.writeFileSync(`${dir}/cr-trail.png`, trail)
console.log('saved to', dir)

// pixel diff between base and revealed
const diff = await page.evaluate(async () => {
  const toData = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src })
  return 'skipped'
})
await browser.close()
