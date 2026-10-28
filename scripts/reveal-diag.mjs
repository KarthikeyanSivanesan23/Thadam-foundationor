import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
page.on('console', m => console.log('console:', m.type(), m.text()))
page.on('pageerror', e => console.log('pageerror', String(e)))
await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
const box = await page.locator('.cursor-reveal').boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.waitForTimeout(400)
const out = await page.evaluate(() => {
  const [base, reveal] = document.querySelectorAll('.cursor-reveal__layer')
  const stat = c => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let m = 0, n = 0
    for (let i = 3; i < d.length; i += 4) { if (d[i] > m) m = d[i]; if (d[i] > 0) n++ }
    return { max: m, nonZero: n, w: c.width, h: c.height }
  }
  return { base: stat(base), reveal: stat(reveal) }
})
console.log('states', JSON.stringify(out))
await browser.close()
