// Renders public/icon.svg to the PNG sizes the PWA manifest needs.
;(async () => {
const { chromium } = require('playwright')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const svg = readFileSync(path.join(__dirname, '../public/icon.svg'), 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['apple-touch-icon.png', 180, 0], ['icon-maskable-512.png', 512, 0.12]]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<body style="margin:0;background:#f8f7f3"><div style="padding:${size * pad}px">${svg.replace('<svg', `<svg width="${size * (1 - 2 * pad)}" height="${size * (1 - 2 * pad)}"`)}</div></body>`)
  await page.screenshot({ path: path.join(__dirname, '../public', name) })
}
await browser.close()
})()
