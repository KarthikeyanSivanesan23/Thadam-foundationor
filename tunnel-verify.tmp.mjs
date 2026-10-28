import { chromium } from '@playwright/test'

const run = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const probe = async (label) => {
    const s = await page.evaluate(() => {
      const title = document.querySelector('.hero [class*="max-w-xl"]')
      const promptEl = [...document.querySelectorAll('.hero span')].find(x => x.textContent === 'Scroll to Explore')
      return {
        y: window.scrollY,
        titleOpacity: getComputedStyle(title).opacity,
        titleTransform: getComputedStyle(title).transform,
        promptOpacity: promptEl ? getComputedStyle(promptEl.parentElement).opacity : 'n/a',
        imageCount: document.querySelectorAll('.hero img').length,
      }
    })
    console.log(label, JSON.stringify(s))
  }
  await probe('rest:')
  await page.locator('.hero').screenshot({ path: 'C:/Users/karth/AppData/Local/Temp/opencode/tunnel-text-rest.png' })
  await page.evaluate(() => window.scrollTo(0, 500))
  await page.waitForTimeout(2500)
  await probe('scrolled500:')
  await page.locator('.hero').screenshot({ path: 'C:/Users/karth/AppData/Local/Temp/opencode/tunnel-text-500.png' })
  await page.evaluate(() => window.scrollTo(0, 0))
  console.log(errors.length ? errors.join('\n') : 'no page errors')
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
