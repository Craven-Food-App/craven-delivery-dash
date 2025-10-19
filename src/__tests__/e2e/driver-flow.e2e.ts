import { test, expect } from '@playwright/test';

test.describe('Driver Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to driver dashboard
    await page.goto('/mobile');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="driver-dashboard"]');
  });

  test('Driver can go online and receive orders', async ({ page }) => {
    // Click CRAVE NOW button
    await page.click('[data-testid="crave-now-button"]');
    
    // Should show "Still searching" state
    await expect(page.locator('text=Still searching')).toBeVisible();
    
    // Should show popular times chart
    await expect(page.locator('[data-testid="popular-times-chart"]')).toBeVisible();
    
    // Should show time selector
    await expect(page.locator('[data-testid="time-selector"]')).toBeVisible();
  });

  test('Driver can pause and resume', async ({ page }) => {
    // Go online first
    await page.click('[data-testid="crave-now-button"]');
    await page.waitForSelector('text=Still searching');
    
    // Click pause button
    await page.click('[data-testid="pause-button"]');
    
    // Should show paused state
    await expect(page.locator('text=Paused')).toBeVisible();
    
    // Click resume button
    await page.click('[data-testid="resume-button"]');
    
    // Should show searching state again
    await expect(page.locator('text=Still searching')).toBeVisible();
  });

  test('Driver can access hamburger menu', async ({ page }) => {
    // Click hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Should show menu items
    await expect(page.locator('text=Torrance S')).toBeVisible();
    await expect(page.locator('text=Schedule')).toBeVisible();
    await expect(page.locator('text=Earnings')).toBeVisible();
    await expect(page.locator('text=Account')).toBeVisible();
  });

  test('Driver can navigate to schedule', async ({ page }) => {
    // Open hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Click schedule
    await page.click('text=Schedule');
    
    // Should navigate to schedule page
    await expect(page.locator('[data-testid="schedule-section"]')).toBeVisible();
  });

  test('Driver can navigate to earnings', async ({ page }) => {
    // Open hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Click earnings
    await page.click('text=Earnings');
    
    // Should navigate to earnings page
    await expect(page.locator('[data-testid="earnings-section"]')).toBeVisible();
  });

  test('Driver can navigate to account', async ({ page }) => {
    // Open hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Click account
    await page.click('text=Account');
    
    // Should navigate to account page
    await expect(page.locator('[data-testid="account-section"]')).toBeVisible();
  });

  test('Driver can logout', async ({ page }) => {
    // Open hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Click logout
    await page.click('text=Logout');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/driver/auth');
  });

  test('Driver can set end time', async ({ page }) => {
    // Go online
    await page.click('[data-testid="crave-now-button"]');
    
    // Click on time selector
    await page.click('[data-testid="time-selector"]');
    
    // Select a time (e.g., 2 hours from now)
    await page.click('[data-testid="time-option-2h"]');
    
    // Should show selected time
    await expect(page.locator('[data-testid="selected-time"]')).toBeVisible();
  });

  test('Driver can change vehicle type', async ({ page }) => {
    // Open hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Click account
    await page.click('text=Account');
    
    // Click vehicle type selector
    await page.click('[data-testid="vehicle-type-selector"]');
    
    // Select different vehicle type
    await page.click('[data-testid="vehicle-option-bike"]');
    
    // Should update vehicle type
    await expect(page.locator('text=Bike')).toBeVisible();
  });

  test('Driver can change earning mode', async ({ page }) => {
    // Open hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Click account
    await page.click('text=Account');
    
    // Click earning mode selector
    await page.click('[data-testid="earning-mode-selector"]');
    
    // Select different earning mode
    await page.click('[data-testid="earning-mode-per-hour"]');
    
    // Should update earning mode
    await expect(page.locator('text=Per Hour')).toBeVisible();
  });

  test('Driver can view popular times chart', async ({ page }) => {
    // Should show popular times chart in offline state
    await expect(page.locator('[data-testid="popular-times-chart"]')).toBeVisible();
    
    // Should show time slots
    await expect(page.locator('[data-testid="time-slot-6a"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-slot-12p"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-slot-6p"]')).toBeVisible();
  });

  test('Driver can see speed limit and current speed', async ({ page }) => {
    // Should show speed limit sign
    await expect(page.locator('[data-testid="speed-limit-sign"]')).toBeVisible();
    
    // Should show current speed
    await expect(page.locator('[data-testid="current-speed"]')).toBeVisible();
  });

  test('Driver can use recenter button', async ({ page }) => {
    // Should show recenter button
    await expect(page.locator('[data-testid="recenter-button"]')).toBeVisible();
    
    // Click recenter button
    await page.click('[data-testid="recenter-button"]');
    
    // Should recenter map (this would be tested with map interactions)
  });

  test('Driver can handle network offline', async ({ page }) => {
    // Simulate offline network
    await page.context().setOffline(true);
    
    // Should show offline indicator
    await expect(page.locator('text=You\'re offline')).toBeVisible();
    
    // Should still allow basic functionality
    await expect(page.locator('[data-testid="crave-now-button"]')).toBeVisible();
  });

  test('Driver can handle network slow connection', async ({ page }) => {
    // Simulate slow connection
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    // Should show slow connection indicator
    await expect(page.locator('text=Slow connection')).toBeVisible();
  });

  test('Driver can handle errors gracefully', async ({ page }) => {
    // Mock API errors
    await page.route('**/api/**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    
    // Try to go online
    await page.click('[data-testid="crave-now-button"]');
    
    // Should handle error gracefully
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('Driver can complete full delivery flow', async ({ page }) => {
    // This would test the complete delivery flow from order acceptance to completion
    // Implementation depends on the specific delivery flow components
    
    // Go online
    await page.click('[data-testid="crave-now-button"]');
    
    // Simulate receiving an order
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('orderAssignment', {
        detail: {
          assignment_id: 'test-order-123',
          restaurant_name: 'Test Restaurant',
          customer_name: 'Test Customer',
          order_total: 25.99,
          delivery_fee: 3.99,
          driver_pay: 8.50
        }
      }));
    });
    
    // Should show order assignment modal
    await expect(page.locator('[data-testid="order-assignment-modal"]')).toBeVisible();
    
    // Accept order
    await page.click('[data-testid="accept-order-button"]');
    
    // Should show delivery flow
    await expect(page.locator('[data-testid="delivery-flow"]')).toBeVisible();
  });
});
