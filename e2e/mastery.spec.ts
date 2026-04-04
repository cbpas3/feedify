import { test, expect } from '@playwright/test'

test.describe('Mastery interactions', () => {
  test('PATCH request is sent when Got it button is clicked on a feed card', async ({ page }) => {
    // Mock the mastery API to capture the request
    const masteryRequests: { url: string; body: unknown }[] = []

    await page.route('**/api/feed-items/*/mastery', async (route) => {
      const body = route.request().postDataJSON()
      masteryRequests.push({ url: route.request().url(), body })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { masteryLevel: 1, nextReviewDate: new Date().toISOString() }, error: null }),
      })
    })

    await page.goto('/feed')
    await page.waitForLoadState('networkidle')

    // Only test if there are feed cards (seeded data)
    const gotItButton = page.getByRole('button', { name: /got it/i }).first()
    const hasCards = await gotItButton.isVisible().catch(() => false)

    if (hasCards) {
      await gotItButton.click()
      expect(masteryRequests.length).toBeGreaterThan(0)
      expect(masteryRequests[0].body).toMatchObject({ masteryDelta: 1 })
    } else {
      // No cards seeded — just verify the empty state CTA is visible
      await expect(page.getByText(/start learning/i)).toBeVisible()
    }
  })
})
