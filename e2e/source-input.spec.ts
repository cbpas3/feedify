import { test, expect } from '@playwright/test'

test.describe('SourceInput modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feed')
    await page.getByRole('button', { name: /add/i }).click()
    await expect(page.getByText('Add Content')).toBeVisible()
  })

  test('switches between Paste Text and Enter URL tabs', async ({ page }) => {
    // Default tab is "Paste Text"
    await expect(page.getByPlaceholder(/paste your article/i)).toBeVisible()

    // Switch to URL tab
    await page.getByRole('button', { name: /enter url/i }).click()
    await expect(page.getByPlaceholder(/https:\/\/example\.com/i)).toBeVisible()
  })

  test('Generate Feed button is disabled when textarea is empty', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /generate feed/i })
    await expect(submitButton).toBeDisabled()
  })

  test('Generate Feed button enables when text is entered', async ({ page }) => {
    await page.getByPlaceholder(/paste your article/i).fill('This is some test content for the feed.')
    const submitButton = page.getByRole('button', { name: /generate feed/i })
    await expect(submitButton).toBeEnabled()
  })

  test('shows character counter for text input', async ({ page }) => {
    const textarea = page.getByPlaceholder(/paste your article/i)
    await textarea.fill('Hello world')
    // Should show character count
    await expect(page.getByText(/11\s*\/\s*100,000/)).toBeVisible()
  })

  test('closes modal with X button', async ({ page }) => {
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.getByText('Add Content')).not.toBeVisible()
  })
})
