import { expect, test } from "@playwright/test"

test.describe("Dayflow workspace", () => {
  test("employee can draft and confirm a leave request through Flow", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /Good morning, Arjun/i })).toBeVisible()

    await page.getByRole("button", { name: "Ask Flow" }).click()
    const prompt = page.getByPlaceholder("Ask about your workday...")
    await prompt.fill("I need sick leave")
    await prompt.press("Enter")

    await expect(page.getByText(/draft a 2-day Sick Leave request/i)).toBeVisible()
    await page.getByRole("button", { name: "Confirm request" }).click()
    await expect(page.getByText(/now Pending/i)).toBeVisible()

    await page.getByRole("button", { name: "Leave & time off" }).click()
    await expect(page.getByRole("heading", { name: "Leave requests" })).toBeVisible()
  })

  test("role switch keeps shell identity and navigation context aligned", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "HR view" }).click()
    await expect(page.getByRole("heading", { name: /Good morning, Ashwith/i })).toBeVisible()
    await expect(page.getByText("People Ops").first()).toBeVisible()
    await page.getByRole("button", { name: "People" }).click()
    await expect(page.getByRole("heading", { name: "Your people" })).toBeVisible()
  })
})
