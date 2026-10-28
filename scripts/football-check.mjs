import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))
page.on('response', (r) => { if (r.url().includes('football')) console.log('glb resp', r.status(), r.url()) })

await page.goto('http://localhost:5180/', { waitUntil: 'load' })
await page.waitForTimeout(6000)

const canvases = await page.evaluate(() =>
  [...document.querySelectorAll('canvas')].map((c) => ({ w: c.width, h: c.height })),
)
console.log('canvases', JSON.stringify(canvases))
console.log('errors', JSON.stringify(errors))
await browser.close()
