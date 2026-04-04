import { test, expect } from '@playwright/test'

test.describe('Feed page', () => {
  test('loads the feed page without errors', async ({ page }) => {
    await page.goto('/feed')
    await expect(page).toHaveURL('/feed')
    // No console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForLoadState('networkidle')
    expect(errors.filter((e) => !e.includes('NEXT_NOT_FOUND'))).toHaveLength(0)
  })

  test('redirects / to /feed', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/feed')
  })

  test('shows TopBar with Feedify logo', async ({ page }) => {
    await page.goto('/feed')
    await expect(page.getByText('Feedify')).toBeVisible()
  })

  test('shows Add Content button in TopBar', async ({ page }) => {
    await page.goto('/feed')
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible()
  })

  test('opens SourceInput modal when Add button is clicked', async ({ page }) => {
    await page.goto('/feed')
    await page.getByRole('button', { name: /add/i }).click()
    await expect(page.getByText('Add Content')).toBeVisible()
    await expect(page.getByPlaceholder(/paste your article/i)).toBeVisible()
  })
})
