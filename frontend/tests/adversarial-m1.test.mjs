// frontend/tests/adversarial-m1.test.mjs
// Adversarial Stress-Test Suite for Milestone M1 (Header & Mobile Drawer)
// Executed by Challenger M1-1

import { launchCdpBrowser } from './cdp-client.mjs';
import { ensureServer } from './server-manager.mjs';
import { mockAmbassadorUser } from './mock-api.mjs';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class AdversarialRunner {
  constructor() {
    this.results = [];
    this.currentGroup = '';
  }

  setGroup(groupName) {
    this.currentGroup = groupName;
    console.log(`\n============================================================`);
    console.log(`  ${groupName.toUpperCase()}`);
    console.log(`============================================================`);
  }

  async test(name, fn) {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      console.log(`  [PASS] ${name} (${duration}ms)`);
      this.results.push({ group: this.currentGroup, name, pass: true, duration });
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`  [FAIL] ${name} (${duration}ms)`);
      console.error(`         Failure: ${err.message}`);
      this.results.push({ group: this.currentGroup, name, pass: false, duration, error: err.message });
    }
  }

  summary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.pass).length;
    const failed = total - passed;

    console.log(`\n============================================================`);
    console.log(`  ADVERSARIAL CHALLENGE EXECUTION SUMMARY`);
    console.log(`============================================================`);
    console.log(`  Total Challenges : ${total}`);
    console.log(`  Passed           : ${passed}`);
    console.log(`  Failed           : ${failed}`);
    console.log(`  Success Rate     : ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    console.log(`============================================================\n`);

    if (failed > 0) {
      console.log('Failed Challenges:');
      this.results
        .filter((r) => !r.pass)
        .forEach((r, i) => {
          console.log(`  ${i + 1}. [${r.group}] ${r.name}`);
          console.log(`     Error: ${r.error}`);
        });
      console.log('');
    }

    return { total, passed, failed, results: this.results };
  }
}

export async function runAdversarialM1() {
  const runner = new AdversarialRunner();
  let serverInfo = null;
  let browser = null;

  try {
    serverInfo = await ensureServer({ port: 5174 });
    const baseUrl = serverInfo.baseUrl;

    browser = await launchCdpBrowser({ port: 9345 });
    const page = await browser.newPage();

    // Authenticate and open dashboard
    await page.navigate(`${baseUrl}/login`);
    await page.seedAuth(mockAmbassadorUser);
    await page.navigate(`${baseUrl}/dashboard`);
    await page.waitForSelector('header', { timeout: 6000 });

    // =========================================================================
    // GROUP 1: Viewport Boundary & Overflow Sweep (Closed Drawer)
    // =========================================================================
    runner.setGroup('Group 1: Viewport Boundary & Overflow Sweep (Closed Drawer)');

    const closedViewports = [
      { width: 360, height: 640, name: '360px Compact Android', isMobile: true, hideLogout: true },
      { width: 375, height: 667, name: '375px iPhone SE', isMobile: true, hideLogout: true },
      { width: 390, height: 844, name: '390px iPhone 12/13/14', isMobile: true, hideLogout: true },
      { width: 414, height: 896, name: '414px iPhone Plus', isMobile: true, hideLogout: true },
      { width: 768, height: 1024, name: '768px iPad Portrait', isMobile: true, hideLogout: false },
      { width: 1023, height: 768, name: '1023px Sub-Desktop Boundary', isMobile: true, hideLogout: false },
      { width: 1024, height: 768, name: '1024px Exact Desktop Boundary', isMobile: false, hideLogout: false },
      { width: 1280, height: 800, name: '1280px Standard Desktop', isMobile: false, hideLogout: false },
    ];

    for (const vp of closedViewports) {
      await runner.test(`1. Viewport ${vp.name}: overflow & responsive visibility`, async () => {
        await page.setViewport({ width: vp.width, height: vp.height, mobile: vp.isMobile });
        await sleep(150);

        // Check horizontal overflow
        const overflowCheck = await page.checkNoHorizontalOverflow();
        if (!overflowCheck.pass) {
          throw new Error(
            `Horizontal overflow at ${vp.width}px: scrollWidth (${overflowCheck.scrollWidth}px) > innerWidth (${overflowCheck.innerWidth}px) by ${overflowCheck.overflowPx}px`
          );
        }

        // Header collision check: header height must not explode (single row expected)
        const headerMetrics = await page.evaluate(`
          (() => {
            const h = document.querySelector('header');
            if (!h) return { exists: false };
            const rect = h.getBoundingClientRect();
            return { exists: true, height: rect.height, right: rect.right, width: rect.width };
          })()
        `);
        if (!headerMetrics.exists) throw new Error('Header not found in DOM');
        if (headerMetrics.height > 65) {
          throw new Error(`Header height wrapped/exploded to ${headerMetrics.height}px at ${vp.width}px viewport`);
        }

        // Hamburger visibility
        const hamburgerVisible = await page.isVisible('button[aria-label="Toggle navigation menu"]');
        if (vp.isMobile && !hamburgerVisible) {
          throw new Error(`Hamburger toggle button must be visible at ${vp.width}px (<1024px)`);
        }
        if (!vp.isMobile && hamburgerVisible) {
          throw new Error(`Hamburger toggle button must be hidden at ${vp.width}px (>=1024px)`);
        }

        // Desktop sidebar visibility
        const sidebarVisible = await page.isVisible('aside.hidden.lg\\:block');
        if (vp.isMobile && sidebarVisible) {
          throw new Error(`Desktop sidebar must be hidden at ${vp.width}px (<1024px)`);
        }
        if (!vp.isMobile && !sidebarVisible) {
          throw new Error(`Desktop sidebar must be visible at ${vp.width}px (>=1024px)`);
        }

        // Header logout button visibility (<sm: hidden, >=sm: visible)
        if (vp.hideLogout) {
          const logoutVisible = await page.isVisible('header button[title="Logout"]');
          if (logoutVisible) {
            throw new Error(`Redundant header logout button should be hidden at ${vp.width}px (<sm:)`);
          }
        }
      });
    }

    // =========================================================================
    // GROUP 2: Drawer Open State & Dimension Invariance
    // =========================================================================
    runner.setGroup('Group 2: Drawer Open State & Dimension Invariance');

    const drawerOpenViewports = [
      { width: 360, height: 640, name: '360px' },
      { width: 375, height: 667, name: '375px' },
      { width: 390, height: 844, name: '390px' },
      { width: 768, height: 1024, name: '768px' },
    ];

    for (const vp of drawerOpenViewports) {
      await runner.test(`2. Drawer open at ${vp.name}: overflow, width limit, 8 links, body scroll lock`, async () => {
        await page.setViewport({ width: vp.width, height: vp.height, mobile: true });
        await sleep(100);

        // Open drawer
        await page.click('button[aria-label="Toggle navigation menu"]');
        await sleep(350); // wait for 300ms transition

        const drawerInfo = await page.evaluate(`
          (() => {
            const drawer = document.querySelector('[data-testid="mobile-drawer"]');
            if (!drawer) return { found: false };
            const aside = drawer.querySelector('aside');
            const asideRect = aside ? aside.getBoundingClientRect() : null;
            const links = Array.from(drawer.querySelectorAll('nav a')).map(a => a.textContent.trim());
            const hasTranslate0 = aside ? aside.classList.contains('translate-x-0') : false;
            const backdrop = drawer.querySelector('[aria-label="Close navigation backdrop"]');
            const backdropOpacity = backdrop ? window.getComputedStyle(backdrop).opacity : null;

            return {
              found: true,
              dataState: drawer.getAttribute('data-state'),
              asideWidth: asideRect ? asideRect.width : 0,
              asideLeft: asideRect ? asideRect.left : -999,
              hasTranslate0,
              backdropOpacity,
              links,
              bodyOverflow: document.body.style.overflow,
              whatsappLink: drawer.querySelector('a[href*="whatsapp.com"]') !== null,
              logoutButton: drawer.querySelector('button') !== null
            };
          })()
        `);

        if (!drawerInfo.found) throw new Error('Mobile drawer container not found');
        if (drawerInfo.dataState !== 'open') throw new Error(`Expected data-state=open, got ${drawerInfo.dataState}`);
        if (!drawerInfo.hasTranslate0) throw new Error('Drawer aside missing translate-x-0 class');
        if (drawerInfo.asideLeft < 0) throw new Error(`Drawer aside not anchored at left 0: left=${drawerInfo.asideLeft}`);

        // Max width check (max-w-[85vw])
        const maxAllowedWidth = vp.width * 0.85 + 2;
        if (drawerInfo.asideWidth > maxAllowedWidth) {
          throw new Error(`Drawer width (${drawerInfo.asideWidth}px) exceeds 85vw limit (${maxAllowedWidth}px)`);
        }

        // Body scroll lock check
        if (drawerInfo.bodyOverflow !== 'hidden') {
          throw new Error(`Expected body scroll overflow hidden, got ${drawerInfo.bodyOverflow}`);
        }

        // Zero horizontal overflow check while open
        const overflow = await page.checkNoHorizontalOverflow();
        if (!overflow.pass) {
          throw new Error(`Horizontal overflow with drawer open at ${vp.width}px: scrollWidth (${overflow.scrollWidth}px) > innerWidth (${overflow.innerWidth}px)`);
        }

        // Verify 8 navigation items
        const expectedItems = [
          'Dashboard',
          'Tasks',
          'About & Rewards',
          'Leaderboard',
          'My Sales',
          'My Points',
          'Profile',
          'Admin',
        ];
        for (const item of expectedItems) {
          const found = drawerInfo.links.some((l) => l.includes(item));
          if (!found) throw new Error(`Missing expected link "${item}" in drawer links: ${JSON.stringify(drawerInfo.links)}`);
        }

        // Verify points badge on My Points
        const pointsLink = drawerInfo.links.find((l) => l.includes('My Points'));
        if (!pointsLink || !pointsLink.includes('pts')) {
          throw new Error(`My Points item missing points pill badge: ${pointsLink}`);
        }

        // Verify WhatsApp link and logout
        if (!drawerInfo.whatsappLink) throw new Error('Missing WhatsApp ambassador group link in mobile drawer');

        // Close drawer for next test
        await page.click('button[aria-label="Close navigation drawer"]');
        await sleep(350);
      });
    }

    // =========================================================================
    // GROUP 3: Stress Testing Adversarial User Data (Large Numbers & Long Strings)
    // =========================================================================
    runner.setGroup('Group 3: Stress Testing Adversarial User Data');

    await runner.test('3.1 Large points score (9,999,999 pts) does not cause collision at 360px', async () => {
      await page.setViewport({ width: 360, height: 640, mobile: true });

      // Inject high score in user object
      const highPointsUser = {
        ...mockAmbassadorUser,
        totalPoints: 9999999,
      };
      await page.seedAuth(highPointsUser);
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });
      await sleep(200);

      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(`Horizontal overflow with high points: scrollWidth=${check.scrollWidth} > innerWidth=${check.innerWidth}`);
      }

      const headerHeight = await page.evaluate(`document.querySelector('header').getBoundingClientRect().height`);
      if (headerHeight > 65) {
        throw new Error(`Header collision/wrap triggered by high points: height=${headerHeight}px`);
      }
    });

    await runner.test('3.2 Long user name does not cause horizontal overflow at 360px', async () => {
      await page.setViewport({ width: 360, height: 640, mobile: true });

      const longNameUser = {
        ...mockAmbassadorUser,
        name: 'Ambassador Dr. Padmavathamma Venkatarama Sundaramurthy',
        totalPoints: 1250,
      };
      await page.seedAuth(longNameUser);
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });
      await sleep(200);

      const check = await page.checkNoHorizontalOverflow();
      if (!check.pass) {
        throw new Error(`Horizontal overflow with long name: scrollWidth=${check.scrollWidth} > innerWidth=${check.innerWidth}`);
      }

      // Open drawer and check if long name truncates cleanly inside drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      const drawerCheck = await page.checkNoHorizontalOverflow();
      if (!drawerCheck.pass) {
        throw new Error(`Drawer overflowed with long name: scrollWidth=${drawerCheck.scrollWidth} > innerWidth=${drawerCheck.innerWidth}`);
      }

      // Close drawer
      await page.click('button[aria-label="Close navigation drawer"]');
      await sleep(350);

      // Restore normal user
      await page.seedAuth(mockAmbassadorUser);
    });

    // =========================================================================
    // GROUP 4: Rapid Open/Close Toggle Burst Stress Test
    // =========================================================================
    runner.setGroup('Group 4: Rapid Open/Close Toggle Burst Stress Test');

    await runner.test('4.1 20 rapid hamburger toggle clicks at 390px maintains state integrity', async () => {
      await page.setViewport({ width: 390, height: 844, mobile: true });
      await sleep(100);

      // Rapidly click hamburger 20 times (every 40ms)
      for (let i = 0; i < 20; i++) {
        await page.evaluate(`document.querySelector('button[aria-label="Toggle navigation menu"]').click()`);
        await sleep(40);
      }

      // Wait 400ms for transition settling
      await sleep(400);

      // Verify that data-state and body.overflow are strictly in sync
      const syncStatus = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]');
          const aside = drawer.querySelector('aside');
          const dataState = drawer.getAttribute('data-state');
          const isTranslate0 = aside.classList.contains('translate-x-0');
          const isTranslateXFull = aside.classList.contains('-translate-x-full');
          const bodyOverflow = document.body.style.overflow;

          return {
            dataState,
            isTranslate0,
            isTranslateXFull,
            bodyOverflow,
            synced: (dataState === 'open' && isTranslate0 && bodyOverflow === 'hidden') ||
                    (dataState === 'closed' && isTranslateXFull && (bodyOverflow === 'unset' || bodyOverflow === ''))
          };
        })()
      `);

      if (!syncStatus.synced) {
        throw new Error(`State de-synchronized after burst toggle: ${JSON.stringify(syncStatus)}`);
      }

      // Toggle once more to confirm button remains fully interactive and responsive
      const targetState = syncStatus.dataState === 'open' ? 'closed' : 'open';
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      const afterState = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      if (afterState !== targetState) {
        throw new Error(`Drawer unresponsive after burst: expected ${targetState}, got ${afterState}`);
      }

      // If open, close it cleanly
      if (afterState === 'open') {
        await page.click('button[aria-label="Toggle navigation menu"]');
        await sleep(350);
      }
    });

    // =========================================================================
    // GROUP 5: Backdrop & Interaction Boundaries
    // =========================================================================
    runner.setGroup('Group 5: Backdrop & Interaction Boundaries');

    await runner.test('5.1 Clicking inside drawer panel does NOT dismiss the drawer', async () => {
      await page.setViewport({ width: 390, height: 844, mobile: true });

      // Open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Click on drawer aside's header (non-button area)
      await page.evaluate(`
        (() => {
          const aside = document.querySelector('[data-testid="mobile-drawer"] aside');
          const header = aside.querySelector('h3');
          header.click();
        })()
      `);
      await sleep(200);

      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      if (state !== 'open') {
        throw new Error(`Clicking inside drawer panel accidentally closed it! State is: ${state}`);
      }
    });

    await runner.test('5.2 Clicking backdrop dismisses drawer and restores body scroll', async () => {
      // Click backdrop
      await page.click('[aria-label="Close navigation backdrop"]');
      await sleep(350);

      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      const bodyOverflow = await page.getBodyOverflowStyle();
      if (state !== 'closed') throw new Error(`Backdrop click failed to close drawer: state=${state}`);
      if (bodyOverflow !== 'unset' && bodyOverflow !== '') {
        throw new Error(`Body scroll overflow not restored to unset: ${bodyOverflow}`);
      }
    });

    await runner.test('5.3 When drawer is closed, pointer events pass through to underlying page', async () => {
      // Drawer is closed; test that clicking a page element works without backdrop intercepting
      const canClickPage = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('[data-testid="mobile-drawer"]');
          const computedStyle = window.getComputedStyle(drawer);
          return computedStyle.pointerEvents === 'none';
        })()
      `);

      if (!canClickPage) {
        throw new Error('Closed drawer does not have pointer-events: none, blocking clicks to page');
      }
    });

    // =========================================================================
    // GROUP 6: Keyboard Accessibility & Escape Key Edge Cases
    // =========================================================================
    runner.setGroup('Group 6: Keyboard Accessibility & Escape Key Edge Cases');

    await runner.test('6.1 Escape key when drawer is closed does nothing and causes no error', async () => {
      await page.pressEscape();
      await sleep(150);

      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      const bodyOverflow = await page.getBodyOverflowStyle();
      if (state !== 'closed') throw new Error(`Drawer opened by Escape: ${state}`);
      if (bodyOverflow !== 'unset' && bodyOverflow !== '') {
        throw new Error(`Body overflow corrupted by Escape: ${bodyOverflow}`);
      }
    });

    await runner.test('6.2 Escape key dismisses open drawer', async () => {
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      await page.pressEscape();
      await sleep(350);

      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      const bodyOverflow = await page.getBodyOverflowStyle();
      if (state !== 'closed') throw new Error(`Escape key failed to close drawer: state=${state}`);
      if (bodyOverflow !== 'unset' && bodyOverflow !== '') {
        throw new Error(`Body overflow not restored after Escape: ${bodyOverflow}`);
      }
    });

    await runner.test('6.3 Burst of 10 Escape key presses causes no error or de-sync', async () => {
      for (let i = 0; i < 10; i++) {
        await page.pressEscape();
        await sleep(30);
      }
      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      if (state !== 'closed') throw new Error(`State corrupted by Escape burst: ${state}`);
    });

    // =========================================================================
    // GROUP 7: Route Navigation Auto-Close
    // =========================================================================
    runner.setGroup('Group 7: Route Navigation Auto-Close');

    await runner.test('7.1 Clicking different route (/tasks) navigates and auto-closes drawer', async () => {
      await page.setViewport({ width: 390, height: 844, mobile: true });
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Click Tasks
      await page.click('[data-testid="mobile-drawer"] a[href="/tasks"]');
      await sleep(400);

      const pathname = await page.evaluate('window.location.pathname');
      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      const bodyOverflow = await page.getBodyOverflowStyle();

      if (pathname !== '/tasks') throw new Error(`Expected route /tasks, got ${pathname}`);
      if (state !== 'closed') throw new Error(`Drawer did not auto-close on route change: state=${state}`);
      if (bodyOverflow !== 'unset' && bodyOverflow !== '') {
        throw new Error(`Body overflow not restored after navigation: ${bodyOverflow}`);
      }
    });

    await runner.test('7.2 Clicking current active route (/tasks) still closes drawer', async () => {
      // Re-open drawer on /tasks
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Click Tasks again (same route)
      await page.click('[data-testid="mobile-drawer"] a[href="/tasks"]');
      await sleep(350);

      const pathname = await page.evaluate('window.location.pathname');
      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      const bodyOverflow = await page.getBodyOverflowStyle();

      if (pathname !== '/tasks') throw new Error(`Expected route /tasks, got ${pathname}`);
      if (state !== 'closed') throw new Error(`Drawer did not close when clicking active route link: state=${state}`);
      if (bodyOverflow !== 'unset' && bodyOverflow !== '') {
        throw new Error(`Body overflow not restored: ${bodyOverflow}`);
      }
    });

    await runner.test('7.3 Clicking Leaderboard navigates and closes drawer', async () => {
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      await page.click('[data-testid="mobile-drawer"] a[href="/leaderboard"]');
      await page.waitForSelector('header', { timeout: 6000 });
      await sleep(300);

      const pathname = await page.evaluate('window.location.pathname');
      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);

      if (pathname !== '/leaderboard') throw new Error(`Expected /leaderboard, got ${pathname}`);
      if (state !== 'closed') throw new Error(`Drawer did not close: state=${state}`);
    });

    // =========================================================================
    // GROUP 8: Dynamic Viewport Resize Cross-Breakpoint
    // =========================================================================
    runner.setGroup('Group 8: Dynamic Viewport Resize Cross-Breakpoint');

    await runner.test('8.1 Resizing to 1024px while drawer is open auto-dismisses drawer & restores desktop sidebar', async () => {
      await page.setViewport({ width: 375, height: 667, mobile: true });
      await page.waitForSelector('button[aria-label="Toggle navigation menu"]', { timeout: 5000 });
      await sleep(100);

      // Open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      // Verify open
      const preState = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      if (preState !== 'open') throw new Error(`Precondition failed: drawer not open (state=${preState})`);

      // Dynamically resize across breakpoint to 1024px
      await page.setViewport({ width: 1024, height: 768, mobile: false });
      // Trigger resize event to make sure listeners fire
      await page.evaluate(`window.dispatchEvent(new Event('resize'))`);
      await sleep(350);

      const postState = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      const bodyOverflow = await page.getBodyOverflowStyle();
      const hamburgerVisible = await page.isVisible('button[aria-label="Toggle navigation menu"]');
      const sidebarVisible = await page.isVisible('aside.hidden.lg\\:block');

      if (postState !== 'closed') throw new Error(`Drawer remained open after resizing to 1024px: ${postState}`);
      if (bodyOverflow !== 'unset' && bodyOverflow !== '') {
        throw new Error(`Body overflow not restored after desktop resize: ${bodyOverflow}`);
      }
      if (hamburgerVisible) throw new Error('Hamburger button visible on desktop (1024px)');
      if (!sidebarVisible) throw new Error('Desktop sidebar not visible on desktop (1024px)');
    });

    await runner.test('8.2 Resizing back down to 375px keeps drawer closed and restores hamburger', async () => {
      // Resize back to 375px
      await page.setViewport({ width: 375, height: 667, mobile: true });
      await page.evaluate(`window.dispatchEvent(new Event('resize'))`);
      await sleep(250);

      const state = await page.evaluate(`document.querySelector('[data-testid="mobile-drawer"]').getAttribute('data-state')`);
      const hamburgerVisible = await page.isVisible('button[aria-label="Toggle navigation menu"]');
      const sidebarVisible = await page.isVisible('aside.hidden.lg\\:block');
      const bodyOverflow = await page.getBodyOverflowStyle();

      if (state !== 'closed') throw new Error(`Drawer magically opened after resizing back down: ${state}`);
      if (!hamburgerVisible) throw new Error('Hamburger button should be visible at 375px');
      if (sidebarVisible) throw new Error('Desktop sidebar should be hidden at 375px');
      if (bodyOverflow !== 'unset' && bodyOverflow !== '') {
        throw new Error(`Body overflow corrupted: ${bodyOverflow}`);
      }
    });

    return runner.summary();
  } finally {
    if (browser) await browser.close();
    if (serverInfo?.spawned) await serverInfo.teardown();
  }
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('adversarial-m1.test.mjs')) {
  runAdversarialM1()
    .then((summary) => {
      if (summary.failed > 0) {
        console.error(`ADVERSARIAL_TESTS_FAILED: ${summary.failed} challenge(s) failed.`);
        process.exit(1);
      } else {
        console.log('ADVERSARIAL_TESTS_PASSED_ALL');
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
