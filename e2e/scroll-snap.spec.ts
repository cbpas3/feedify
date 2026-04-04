import { test, expect } from '@playwright/test'

test.describe('Scroll-snap feed', () => {
  test('feed container has correct scroll-snap CSS', async ({ page }) => {
    await page.goto('/feed')
    await page.waitForLoadState('networkidle')

    const scrollSnapType = await page.evaluate(() => {
      const container = document.querySelector('.feed-container')
      if (!container) return null
      return window.getComputedStyle(container).scrollSnapType
    })

    // Should have mandatory snap on y axis
    expect(scrollSnapType).toMatch(/y mandatory/)
  })

  test('feed items have scroll-snap-align: start', async ({ page }) => {
    await page.goto('/feed')
    await page.waitForLoadState('networkidle')

    const snapAlign = await page.evaluate(() => {
      const item = document.querySelector('.feed-item')
      if (!item) return null
      return window.getComputedStyle(item).scrollSnapAlign
    })

    expect(snapAlign).toBe('start')
  })

  test('feed-container height is 100dvh', async ({ page }) => {
    await page.goto('/feed')

    const containerHeight = await page.evaluate(() => {
      const container = document.querySelector('.feed-container')
      if (!container) return null
      const rect = container.getBoundingClientRect()
      return rect.height
    })

    const viewportHeight = await page.evaluate(() => window.innerHeight)
    // Allow 1px tolerance
    expect(Math.abs((containerHeight ?? 0) - viewportHeight)).toBeLessThanOrEqual(1)
  })
})
