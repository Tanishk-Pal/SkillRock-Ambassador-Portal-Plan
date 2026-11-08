// frontend/tests/e2e-responsive.test.mjs
// Comprehensive E2E Responsive Test Suite for SkillRock Ambassador Portal
// Covers Tiers 1-4 across 360px, 375px, 390px, 768px, and 1024px viewports

import { launchCdpBrowser } from './cdp-client.mjs';
import { ensureServer } from './server-manager.mjs';
import { mockAmbassadorUser } from './mock-api.mjs';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export class TestRunner {
  constructor() {
    this.results = [];
    this.currentTier = '';
  }

  setTier(tierName) {
    this.currentTier = tierName;
    console.log(`\n============================================================`);
    console.log(`  ${tierName.toUpperCase()}`);
    console.log(`============================================================`);
  }

  async runTest(name, fn) {
    const startTime = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - startTime;
      console.log(`  [PASS] ${name} (${durationMs}ms)`);
      this.results.push({
        tier: this.currentTier,
        name,
        passed: true,
        durationMs,
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error(`  [FAIL] ${name} (${durationMs}ms)`);
      console.error(`         Reason: ${err.message}`);
      this.results.push({
        tier: this.currentTier,
        name,
        passed: false,
        durationMs,
        error: err.message,
      });
    }
  }

  summary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`\n============================================================`);
    console.log(`  TEST EXECUTION SUMMARY`);
    console.log(`============================================================`);
    console.log(`  Total Tests : ${total}`);
    console.log(`  Passed      : ${passed}`);
    console.log(`  Failed      : ${failed}`);
    console.log(`  Pass Rate   : ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    console.log(`============================================================\n`);

    if (failed > 0) {
      console.log('  Failed Test Cases:');
      this.results
        .filter((r) => !r.passed)
        .forEach((r, idx) => {
          console.log(`    ${idx + 1}. [${r.tier}] ${r.name}`);
          console.log(`       Error: ${r.error}`);
        });
      console.log('');
    }

    return { total, passed, failed, results: this.results };
  }
}

export async function runE2eTests(options = {}) {
  const runner = new TestRunner();
  let serverInfo = null;
  let browser = null;

  try {
    // 1. Ensure Vite Server is listening
    serverInfo = await ensureServer({ port: options.serverPort || 5174 });
    const baseUrl = serverInfo.baseUrl;

    // 2. Launch headless Chrome via CDP
    browser = await launchCdpBrowser({ port: options.cdpPort || 9339 });
    const page = await browser.newPage();

    // Navigate to initial page and seed authentication in localStorage
    await page.navigate(`${baseUrl}/login`);
    await page.seedAuth(mockAmbassadorUser);

    // =========================================================================
    // TIER 1: Feature Coverage (Drawer, Sidebar, Navigation)
    // =========================================================================
    runner.setTier('Tier 1: Feature Coverage');

    await runner.runTest('1.1 Hamburger button is visible on mobile (<1024px)', async () => {
      await page.setViewport({ width: 390, height: 844 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      const hamburgerVisible = await page.isVisible('button[aria-label="Toggle navigation menu"]');
      if (!hamburgerVisible) {
        throw new Error('Hamburger button [aria-label="Toggle navigation menu"] is not visible at 390px viewport');
      }
    });

    await runner.runTest('1.2 Desktop sidebar is hidden on mobile (<1024px)', async () => {
      await page.setViewport({ width: 390, height: 844 });
      const sidebarVisible = await page.isVisible('aside.hidden.lg\\:block');
      if (sidebarVisible) {
        throw new Error('Desktop sidebar aside.hidden.lg:block should not be visible on 390px mobile viewport');
      }
    });

    await runner.runTest('1.3 Drawer opens when hamburger button is clicked', async () => {
      await page.setViewport({ width: 390, height: 844 });
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350); // Allow slide-in transition

      const drawerState = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]') || document.querySelector('[role="dialog"]');
          if (!drawer) return { found: false };
          const state = drawer.getAttribute('data-state');
          const aside = drawer.querySelector('aside');
          const isTranslated = aside ? aside.className.includes('translate-x-0') : false;
          return { found: true, state, isTranslated };
        })()
      `);

      if (!drawerState.found) {
        throw new Error('Mobile drawer container [data-testid="mobile-drawer"] not found in DOM');
      }
      if (drawerState.state !== 'open' && !drawerState.isTranslated) {
        throw new Error(`Drawer did not open. state: ${drawerState.state}, isTranslated: ${drawerState.isTranslated}`);
      }
    });

    await runner.runTest('1.4 Drawer displays all 8 required navigation links', async () => {
      const requiredLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Tasks', path: '/tasks' },
        { name: 'About & Rewards', path: '/about' },
        { name: 'Leaderboard', path: '/leaderboard' },
        { name: 'My Sales', path: '/my-sales' },
        { name: 'My Points', path: '/my-points' },
        { name: 'Profile', path: '/profile' },
        { name: 'Admin', path: '/admin/dashboard' },
      ];

      const foundLinks = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]') || document.querySelector('[role="dialog"]');
          if (!drawer) return [];
          const links = Array.from(drawer.querySelectorAll('nav a, a[href]'));
          return links.map(a => ({
            text: (a.textContent || '').trim(),
            href: a.getAttribute('href') || ''
          }));
        })()
      `);

      const missing = [];
      for (const req of requiredLinks) {
        const match = foundLinks.some(
          (f) => f.href.includes(req.path) || f.text.toLowerCase().includes(req.name.toLowerCase())
        );
        if (!match) {
          missing.push(`${req.name} (${req.path})`);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Drawer is missing ${missing.length} link(s): ${missing.join(', ')}`);
      }
    });

    await runner.runTest('1.5 Drawer closes on backdrop click', async () => {
      await page.setViewport({ width: 390, height: 844 });
      // Click backdrop
      await page.click('[aria-label="Close navigation backdrop"]');
      await sleep(350); // Allow slide-out transition

      const isOpen = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]') || document.querySelector('[role="dialog"]');
          if (!drawer) return false;
          const state = drawer.getAttribute('data-state');
          const aside = drawer.querySelector('aside');
          const isTranslated = aside ? aside.className.includes('translate-x-0') : false;
          return state === 'open' || isTranslated;
        })()
      `);

      if (isOpen) {
        throw new Error('Drawer remained open after clicking the backdrop');
      }
    });

    await runner.runTest('1.6 Drawer closes on close button (X) click', async () => {
      await page.setViewport({ width: 390, height: 844 });
      // Re-open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Click close button inside drawer
      await page.click('button[aria-label="Close navigation drawer"]');
      await sleep(350);

      const isOpen = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]') || document.querySelector('[role="dialog"]');
          if (!drawer) return false;
          const state = drawer.getAttribute('data-state');
          const aside = drawer.querySelector('aside');
          return state === 'open' || (aside && aside.className.includes('translate-x-0'));
        })()
      `);

      if (isOpen) {
        throw new Error('Drawer remained open after clicking the close (X) button');
      }
    });

    await runner.runTest('1.7 Drawer closes automatically on route navigation link click', async () => {
      await page.setViewport({ width: 390, height: 844 });
      // Re-open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Click "Tasks" link inside drawer
      await page.click('[data-testid="mobile-drawer"] a[href="/tasks"]');
      await sleep(400);

      const currentPath = await page.evaluate('window.location.pathname');
      if (currentPath !== '/tasks') {
        throw new Error(`Navigation failed: expected /tasks, got ${currentPath}`);
      }

      const isOpen = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]') || document.querySelector('[role="dialog"]');
          if (!drawer) return false;
          const state = drawer.getAttribute('data-state');
          const aside = drawer.querySelector('aside');
          return state === 'open' || (aside && aside.className.includes('translate-x-0'));
        })()
      `);

      if (isOpen) {
        throw new Error('Drawer did not auto-close after navigating to /tasks');
      }
    });

    await runner.runTest('1.8 Desktop sidebar is visible on desktop viewports (>=1024px)', async () => {
      await page.setViewport({ width: 1024, height: 800 });
      await sleep(150);

      const sidebarVisible = await page.isVisible('main aside');
      if (!sidebarVisible) {
        throw new Error('Desktop sidebar main aside is not visible at 1024px desktop viewport');
      }
    });

    await runner.runTest('1.9 Hamburger button is hidden on desktop viewports (>=1024px)', async () => {
      await page.setViewport({ width: 1024, height: 800 });
      await sleep(150);

      const hamburgerVisible = await page.isVisible('button[aria-label="Toggle navigation menu"]');
      if (hamburgerVisible) {
        throw new Error('Hamburger button should be hidden at 1024px desktop viewport');
      }
    });

    // =========================================================================
    // TIER 2: Boundary & Corner Cases (Viewports, Overflow, Keys, Scroll Lock)
    // =========================================================================
    runner.setTier('Tier 2: Boundary & Corner Cases');

    await runner.runTest('2.1 Viewport 360px: Zero horizontal overflow (scrollWidth <= innerWidth)', async () => {
      await page.setViewport({ width: 360, height: 740 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });
      await sleep(200);

      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(
          `Horizontal overflow detected at 360px: scrollWidth (${check.scrollWidth}px) > innerWidth (${check.innerWidth}px) by ${check.overflowPx}px`
        );
      }
    });

    await runner.runTest('2.2 Viewport 360px: Header elements do not wrap into broken layouts or collide', async () => {
      await page.setViewport({ width: 360, height: 740 });
      const headerCollision = await page.evaluate(`
        (() => {
          const header = document.querySelector('header');
          if (!header) return { error: 'header not found' };
          const rect = header.getBoundingClientRect();
          const hamburger = header.querySelector('button[aria-label="Toggle navigation menu"]');
          const brand = header.querySelector('a[href="/dashboard"], a[href="/admin/dashboard"]');
          const scorePill = header.querySelector('a[href="/my-points"]');

          const hRect = hamburger ? hamburger.getBoundingClientRect() : null;
          const bRect = brand ? brand.getBoundingClientRect() : null;
          const sRect = scorePill ? scorePill.getBoundingClientRect() : null;

          // Check if header height is abnormally bloated (e.g. wrapped into 3 lines > 85px)
          const excessiveHeight = rect.height > 85;
          // Check if right edge of score pill exceeds header boundary
          const pillOverflows = sRect ? sRect.right > rect.right + 2 : false;

          return {
            headerHeight: rect.height,
            excessiveHeight,
            pillOverflows,
            headerWidth: rect.width,
            windowWidth: window.innerWidth,
          };
        })()
      `);

      if (headerCollision.excessiveHeight) {
        throw new Error(`Header height (${headerCollision.headerHeight}px) indicates multi-line wrapping collision at 360px`);
      }
      if (headerCollision.pillOverflows) {
        throw new Error(`Header score pill overflows right viewport edge at 360px`);
      }
    });

    await runner.runTest('2.3 Viewport 375px: Zero horizontal overflow (iPhone SE)', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await sleep(150);
      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(`Horizontal overflow at 375px: scrollWidth (${check.scrollWidth}px) > innerWidth (${check.innerWidth}px)`);
      }
    });

    await runner.runTest('2.4 Viewport 390px: Zero horizontal overflow (iPhone standard)', async () => {
      await page.setViewport({ width: 390, height: 844 });
      await sleep(150);
      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(`Horizontal overflow at 390px: scrollWidth (${check.scrollWidth}px) > innerWidth (${check.innerWidth}px)`);
      }
    });

    await runner.runTest('2.5 Viewport 768px: Zero horizontal overflow on tablet boundary', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await sleep(150);
      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(`Horizontal overflow at 768px: scrollWidth (${check.scrollWidth}px) > innerWidth (${check.innerWidth}px)`);
      }
    });

    await runner.runTest('2.6 Viewport 1024px: Zero horizontal overflow on desktop boundary', async () => {
      await page.setViewport({ width: 1024, height: 768 });
      await sleep(150);
      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(`Horizontal overflow at 1024px: scrollWidth (${check.scrollWidth}px) > innerWidth (${check.innerWidth}px)`);
      }
    });

    await runner.runTest('2.7 Escape key dismisses open mobile drawer', async () => {
      await page.setViewport({ width: 390, height: 844 });
      // Open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Press Escape
      await page.pressEscape();
      await sleep(350);

      const isOpen = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]') || document.querySelector('[role="dialog"]');
          if (!drawer) return false;
          const state = drawer.getAttribute('data-state');
          const aside = drawer.querySelector('aside');
          return state === 'open' || (aside && aside.className.includes('translate-x-0'));
        })()
      `);

      if (isOpen) {
        throw new Error('Drawer did not dismiss when pressing the Escape key');
      }
    });

    await runner.runTest('2.8 Body scroll is locked when drawer is open and restored when closed', async () => {
      await page.setViewport({ width: 390, height: 844 });

      // Before opening: overflow should not be hidden
      const beforeOverflow = await page.getBodyOverflowStyle();
      if (beforeOverflow === 'hidden') {
        throw new Error(`Initial body overflow should not be "hidden", found: ${beforeOverflow}`);
      }

      // Open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      const openOverflow = await page.getBodyOverflowStyle();
      if (openOverflow !== 'hidden') {
        throw new Error(`Body overflow should be "hidden" when drawer is open, found: "${openOverflow}"`);
      }

      // Close drawer
      await page.click('[aria-label="Close navigation backdrop"]');
      await sleep(300);

      const restoredOverflow = await page.getBodyOverflowStyle();
      if (restoredOverflow === 'hidden') {
        throw new Error(`Body overflow was not restored after closing drawer, remained: "${restoredOverflow}"`);
      }
    });

    // =========================================================================
    // TIER 3: Cross-Feature Combinations (Resize, State Synchronization)
    // =========================================================================
    runner.setTier('Tier 3: Cross-Feature Combinations');

    await runner.runTest('3.1 Drawer automatically closes when resizing across mobile-to-desktop breakpoint (1024px)', async () => {
      await page.setViewport({ width: 390, height: 844 });
      await sleep(100);

      // Open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Resize across breakpoint to 1024px
      await page.setViewport({ width: 1024, height: 800 });
      await sleep(350);

      const drawerState = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]') || document.querySelector('[role="dialog"]');
          if (!drawer) return { open: false };
          const state = drawer.getAttribute('data-state');
          const aside = drawer.querySelector('aside');
          const isTranslated = aside ? aside.className.includes('translate-x-0') : false;
          return { open: state === 'open' || isTranslated };
        })()
      `);

      if (drawerState.open) {
        throw new Error('Drawer remained open after viewport was resized across breakpoint to 1024px');
      }

      const desktopSidebarVisible = await page.isVisible('main aside');
      if (!desktopSidebarVisible) {
        throw new Error('Desktop sidebar should become visible after resizing to 1024px');
      }
    });

    await runner.runTest('3.2 Route navigation via drawer preserving viewport constraints at 360px', async () => {
      await page.setViewport({ width: 360, height: 740 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      // Open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      // Navigate to My Points
      await page.click('[data-testid="mobile-drawer"] a[href="/my-points"]');
      await sleep(400);

      const pathname = await page.evaluate('window.location.pathname');
      if (pathname !== '/my-points') {
        throw new Error(`Expected /my-points route, got ${pathname}`);
      }

      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(
          `Target route /my-points overflows at 360px: scrollWidth (${check.scrollWidth}px) > innerWidth (${check.innerWidth}px)`
        );
      }
    });

    // =========================================================================
    // TIER 4: Real-World Application Scenarios (Full Viewport Sweeps across all pages)
    // =========================================================================
    runner.setTier('Tier 4: Real-World Application Scenarios');

    const ambassadorRoutes = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Tasks', path: '/tasks' },
      { name: 'About & Rewards', path: '/about' },
      { name: 'Leaderboard', path: '/leaderboard' },
      { name: 'My Sales', path: '/my-sales' },
      { name: 'My Points', path: '/my-points' },
      { name: 'Profile', path: '/profile' },
    ];

    const targetViewports = [
      { name: '360px (Compact Android)', width: 360, height: 740 },
      { name: '390px (iPhone Standard)', width: 390, height: 844 },
      { name: '768px (iPad Portrait)', width: 768, height: 1024 },
      { name: '1024px (Desktop Boundary)', width: 1024, height: 768 },
    ];

    for (const route of ambassadorRoutes) {
      for (const vp of targetViewports) {
        await runner.runTest(`4. Viewport Sweep: ${route.name} (${route.path}) at ${vp.name}`, async () => {
          await page.setViewport({ width: vp.width, height: vp.height });
          await page.navigate(`${baseUrl}${route.path}`);
          await page.waitForSelector('header', { timeout: 6000 });
          await sleep(200);

          const check = await page.checkNoHorizontalOverflow();
          if (!check.pass) {
            throw new Error(
              `Horizontal overflow on ${route.name} at ${vp.width}px: scrollWidth (${check.scrollWidth}px) > innerWidth (${check.innerWidth}px) by ${check.overflowPx}px`
            );
          }
        });
      }
    }

    return runner.summary();
  } finally {
    if (browser) {
      await browser.close();
    }
    if (serverInfo?.spawned) {
      await serverInfo.teardown();
    }
  }
}

// Allow direct execution: node frontend/tests/e2e-responsive.test.mjs
if (process.argv[1] && process.argv[1].endsWith('e2e-responsive.test.mjs')) {
  runE2eTests()
    .then((summary) => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal test execution error:', err);
      process.exit(1);
    });
}
