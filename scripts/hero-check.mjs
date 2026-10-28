import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e)))
page.on('response', (r) => { if (r.url().includes('football')) console.log('glb resp', r.status(), r.url()) })
page.on('requestfailed', (r) => console.log('req failed', r.url(), r.failure()?.errorText))

await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(8000)

const info = await page.evaluate(() => {
  const hero = document.querySelector('.hero')
  const stage = document.querySelector('.core-stage')
  const canvas = document.querySelector('.developer-canvas canvas')
  const fallback = document.querySelector('.core-fallback')
  const copy = document.querySelector('.hero-copy')
  const r = (el) => el ? el.getBoundingClientRect() : null
  return {
    heroExists: !!hero,
    heroHTMLLength: hero ? hero.innerHTML.length : 0,
    stageRect: r(stage),
    copyOpacity: copy ? getComputedStyle(copy).opacity : null,
    canvasRect: r(canvas),
    canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
    fallbackShown: !!fallback,
    heroDisplay: hero ? getComputedStyle(hero).display : null,
    heroVisibility: hero ? getComputedStyle(hero).visibility : null,
    heroOpacity: hero ? getComputedStyle(hero).opacity : null,
  }
})
console.log('info', JSON.stringify(info, null, 2))
console.log('errors', JSON.stringify(errors, null, 2))
await page.screenshot({ path: 'C:/Users/karth/AppData/Local/Temp/opencode/hero-check.png', fullPage: false })
await browser.close()
