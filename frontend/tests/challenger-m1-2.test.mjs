// frontend/tests/challenger-m1-2.test.mjs
// Adversarial Challenger 2 Test Harness for Milestone M1
// Focus: Narrow header limits (320px/360px), 8 navigation links in Drawer & Sidebar, and body scroll lock lifecycle.

import { launchCdpBrowser } from './cdp-client.mjs';
import { ensureServer } from './server-manager.mjs';
import { mockAmbassadorUser, mockDashboardData } from './mock-api.mjs';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class ChallengerTestRunner {
  constructor() {
    this.results = [];
    this.currentTier = '';
  }

  setTier(name) {
    this.currentTier = name;
    console.log(`\n============================================================`);
    console.log(`  CHALLENGE: ${name.toUpperCase()}`);
    console.log(`============================================================`);
  }

  async runTest(name, fn) {
    const startTime = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - startTime;
      console.log(`  [PASS] ${name} (${durationMs}ms)`);
      this.results.push({ tier: this.currentTier, name, passed: true, durationMs });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      console.error(`  [FAIL] ${name} (${durationMs}ms)`);
      console.error(`         Reason: ${err.message}`);
      this.results.push({ tier: this.currentTier, name, passed: false, durationMs, error: err.message });
    }
  }

  summary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`\n============================================================`);
    console.log(`  CHALLENGER 2 TEST EXECUTION SUMMARY`);
    console.log(`============================================================`);
    console.log(`  Total Challenges : ${total}`);
    console.log(`  Passed           : ${passed}`);
    console.log(`  Failed           : ${failed}`);
    console.log(`  Pass Rate        : ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    console.log(`============================================================\n`);

    if (failed > 0) {
      console.log('  Failed Challenges:');
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

export async function runChallengerTests() {
  const runner = new ChallengerTestRunner();
  let serverInfo = null;
  let browser = null;

  try {
    // 1. Ensure Vite server is ready on port 5177
    serverInfo = await ensureServer({ port: 5177 });
    const baseUrl = serverInfo.baseUrl;

    // 2. Launch headless Chrome via CDP
    browser = await launchCdpBrowser({ port: 9342 });
    const page = await browser.newPage();

    // Authenticate baseline ambassador
    await page.navigate(`${baseUrl}/login`);
    await page.seedAuth(mockAmbassadorUser);

    // =========================================================================
    // CHALLENGE TIER 1: NARROW HEADER LIMITS & COLLISION STRESS (320px & 360px)
    // =========================================================================
    runner.setTier('Tier 1: Narrow Header Limits & Collision Stress');

    await runner.runTest('1.1: 360px Header Baseline (Score: 2,450 pts) - Metrics & Clearances', async () => {
      mockAmbassadorUser.totalPoints = 2450;
      mockDashboardData.ambassador.totalPoints = 2450;

      await page.setViewport({ width: 360, height: 640 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      const metrics = await page.evaluate(`
        (() => {
          const header = document.querySelector('header');
          const hamburger = header.querySelector('button[aria-label="Toggle navigation menu"]');
          const brand = header.querySelector('a[href="/dashboard"]');
          const scorePill = header.querySelector('a[href="/my-points"]');
          const profile = header.querySelector('a[href="/profile"]');
          const logoutBtn = header.querySelector('button[title="Logout"]');

          const hRect = hamburger.getBoundingClientRect();
          const bRect = brand.getBoundingClientRect();
          const sRect = scorePill.getBoundingClientRect();
          const pRect = profile.getBoundingClientRect();

          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            hamburger: { left: Math.round(hRect.left), right: Math.round(hRect.right), width: Math.round(hRect.width) },
            brand: { left: Math.round(bRect.left), right: Math.round(bRect.right), width: Math.round(bRect.width) },
            scorePill: { left: Math.round(sRect.left), right: Math.round(sRect.right), width: Math.round(sRect.width) },
            profile: { left: Math.round(pRect.left), right: Math.round(pRect.right), width: Math.round(pRect.width) },
            logoutDisplay: logoutBtn ? window.getComputedStyle(logoutBtn).display : 'none',
          };
        })()
      `);

      console.log('    Metrics @ 360px baseline:', JSON.stringify(metrics));

      if (metrics.scrollWidth > metrics.innerWidth) {
        throw new Error(`Horizontal overflow at 360px baseline: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
      }
      if (metrics.hamburger.right > metrics.brand.left) {
        throw new Error(`Collision: Hamburger overlaps Brand: hRight=${metrics.hamburger.right} > bLeft=${metrics.brand.left}`);
      }
      if (metrics.brand.right > metrics.scorePill.left) {
        throw new Error(`Collision: Brand overlaps Score Pill: bRight=${metrics.brand.right} > sLeft=${metrics.scorePill.left}`);
      }
      if (metrics.scorePill.right > metrics.profile.left) {
        throw new Error(`Collision: Score Pill overlaps Profile: sRight=${metrics.scorePill.right} > pLeft=${metrics.profile.left}`);
      }
      if (metrics.profile.right > metrics.innerWidth) {
        throw new Error(`Profile button clipped: pRight=${metrics.profile.right} > innerWidth=${metrics.innerWidth}`);
      }
      if (metrics.logoutDisplay !== 'none') {
        throw new Error(`Redundant header logout button visible at 360px: display=${metrics.logoutDisplay}`);
      }
    });

    await runner.runTest('1.2: 360px Header Stress: 6-Digit Score (999,999 pts)', async () => {
      mockAmbassadorUser.totalPoints = 999999;
      mockDashboardData.ambassador.totalPoints = 999999;

      await page.setViewport({ width: 360, height: 640 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      const metrics = await page.evaluate(`
        (() => {
          const header = document.querySelector('header');
          const brand = header.querySelector('a[href="/dashboard"]');
          const scorePill = header.querySelector('a[href="/my-points"]');
          const profile = header.querySelector('a[href="/profile"]');

          const bRect = brand.getBoundingClientRect();
          const sRect = scorePill.getBoundingClientRect();
          const pRect = profile.getBoundingClientRect();

          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            scoreText: scorePill.textContent.trim(),
            bRight: Math.round(bRect.right),
            sLeft: Math.round(sRect.left),
            sRight: Math.round(sRect.right),
            pLeft: Math.round(pRect.left),
            pRight: Math.round(pRect.right),
            scorePillWidth: Math.round(sRect.width),
          };
        })()
      `);

      console.log('    Metrics @ 360px 6-digit score:', JSON.stringify(metrics));

      if (metrics.scrollWidth > metrics.innerWidth) {
        throw new Error(`Horizontal overflow with 999,999 pts at 360px: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
      }
      if (!metrics.scoreText.includes('999,999')) {
        throw new Error(`Expected score text to contain '999,999', got: "${metrics.scoreText}"`);
      }
      if (metrics.bRight > metrics.sLeft) {
        throw new Error(`Collision between Brand and 6-digit Score Pill: bRight=${metrics.bRight} > sLeft=${metrics.sLeft}`);
      }
      if (metrics.sRight > metrics.pLeft) {
        throw new Error(`Collision between 6-digit Score Pill and Profile: sRight=${metrics.sRight} > pLeft=${metrics.pLeft}`);
      }
      if (metrics.pRight > metrics.innerWidth) {
        throw new Error(`Profile button clipped with 6-digit score: pRight=${metrics.pRight} > innerWidth=${metrics.innerWidth}`);
      }
    });

    await runner.runTest('1.3: 360px Header Stress: 8-Digit Extreme Score (12,345,678 pts)', async () => {
      mockAmbassadorUser.totalPoints = 12345678;
      mockDashboardData.ambassador.totalPoints = 12345678;

      await page.setViewport({ width: 360, height: 640 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      const metrics = await page.evaluate(`
        (() => {
          const header = document.querySelector('header');
          const brand = header.querySelector('a[href="/dashboard"]');
          const scorePill = header.querySelector('a[href="/my-points"]');
          const profile = header.querySelector('a[href="/profile"]');

          const bRect = brand.getBoundingClientRect();
          const sRect = scorePill.getBoundingClientRect();
          const pRect = profile.getBoundingClientRect();

          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            scoreText: scorePill.textContent.trim(),
            bRight: Math.round(bRect.right),
            sLeft: Math.round(sRect.left),
            sRight: Math.round(sRect.right),
            pLeft: Math.round(pRect.left),
            pRight: Math.round(pRect.right),
            scorePillWidth: Math.round(sRect.width),
          };
        })()
      `);

      console.log('    Metrics @ 360px 8-digit score:', JSON.stringify(metrics));

      if (metrics.scrollWidth > metrics.innerWidth) {
        throw new Error(`Horizontal overflow with 12,345,678 pts at 360px: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
      }
      if (metrics.bRight > metrics.sLeft) {
        throw new Error(`Collision between Brand and 8-digit Score Pill: bRight=${metrics.bRight} > sLeft=${metrics.sLeft}`);
      }
      if (metrics.sRight > metrics.pLeft) {
        throw new Error(`Collision between 8-digit Score Pill and Profile: sRight=${metrics.sRight} > pLeft=${metrics.pLeft}`);
      }
    });

    await runner.runTest('1.4: 320px Ultra-Compact Header Baseline (Score: 2,450 pts)', async () => {
      mockAmbassadorUser.totalPoints = 2450;
      mockDashboardData.ambassador.totalPoints = 2450;

      await page.setViewport({ width: 320, height: 568 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      const metrics = await page.evaluate(`
        (() => {
          const header = document.querySelector('header');
          const hamburger = header.querySelector('button[aria-label="Toggle navigation menu"]');
          const brand = header.querySelector('a[href="/dashboard"]');
          const scorePill = header.querySelector('a[href="/my-points"]');
          const profile = header.querySelector('a[href="/profile"]');

          const hRect = hamburger.getBoundingClientRect();
          const bRect = brand.getBoundingClientRect();
          const sRect = scorePill.getBoundingClientRect();
          const pRect = profile.getBoundingClientRect();

          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            hRight: Math.round(hRect.right),
            bLeft: Math.round(bRect.left),
            bRight: Math.round(bRect.right),
            sLeft: Math.round(sRect.left),
            sRight: Math.round(sRect.right),
            pLeft: Math.round(pRect.left),
            pRight: Math.round(pRect.right),
          };
        })()
      `);

      console.log('    Metrics @ 320px baseline:', JSON.stringify(metrics));

      if (metrics.scrollWidth > metrics.innerWidth) {
        throw new Error(`Horizontal overflow at 320px ultra-compact: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
      }
      if (metrics.hRight > metrics.bLeft) {
        throw new Error(`Collision at 320px: Hamburger overlaps Brand (hRight=${metrics.hRight} > bLeft=${metrics.bLeft})`);
      }
      if (metrics.bRight > metrics.sLeft) {
        throw new Error(`Collision at 320px: Brand overlaps Score Pill (bRight=${metrics.bRight} > sLeft=${metrics.sLeft})`);
      }
      if (metrics.sRight > metrics.pLeft) {
        throw new Error(`Collision at 320px: Score Pill overlaps Profile (sRight=${metrics.sRight} > pLeft=${metrics.pLeft})`);
      }
      if (metrics.pRight > metrics.innerWidth) {
        throw new Error(`Collision at 320px: Profile clipped past viewport edge (pRight=${metrics.pRight} > innerWidth=${metrics.innerWidth})`);
      }
    });

    await runner.runTest('1.5: 320px Ultra-Compact Header Stress: 6-Digit Score (999,999 pts)', async () => {
      mockAmbassadorUser.totalPoints = 999999;
      mockDashboardData.ambassador.totalPoints = 999999;

      await page.setViewport({ width: 320, height: 568 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      const metrics = await page.evaluate(`
        (() => {
          const header = document.querySelector('header');
          const brand = header.querySelector('a[href="/dashboard"]');
          const scorePill = header.querySelector('a[href="/my-points"]');
          const profile = header.querySelector('a[href="/profile"]');

          const bRect = brand.getBoundingClientRect();
          const sRect = scorePill.getBoundingClientRect();
          const pRect = profile.getBoundingClientRect();

          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            scoreText: scorePill.textContent.trim(),
            bRight: Math.round(bRect.right),
            sLeft: Math.round(sRect.left),
            sRight: Math.round(sRect.right),
            pLeft: Math.round(pRect.left),
            pRight: Math.round(pRect.right),
            scorePillWidth: Math.round(sRect.width),
            clearanceBetweenBrandAndScore: Math.round(sRect.left - bRect.right),
            clearanceBetweenScoreAndProfile: Math.round(pRect.left - sRect.right),
          };
        })()
      `);

      console.log('    Metrics @ 320px 6-digit score:', JSON.stringify(metrics));

      if (metrics.scrollWidth > metrics.innerWidth) {
        throw new Error(`Horizontal overflow with 999,999 pts at 320px: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
      }
      if (metrics.bRight > metrics.sLeft) {
        throw new Error(`Collision between Brand and Score Pill at 320px: bRight=${metrics.bRight} > sLeft=${metrics.sLeft}`);
      }
      if (metrics.sRight > metrics.pLeft) {
        throw new Error(`Collision between Score Pill and Profile at 320px: sRight=${metrics.sRight} > pLeft=${metrics.pLeft}`);
      }
      if (metrics.pRight > metrics.innerWidth) {
        throw new Error(`Profile clipped at 320px: pRight=${metrics.pRight} > innerWidth=${metrics.innerWidth}`);
      }
    });

    await runner.runTest('1.6: 320px Ultra-Compact Header with Admin Role Pill', async () => {
      // In Header.tsx, when user is admin viewing an ambassador page, it renders the Admin Console pill
      const adminUser = { ...mockAmbassadorUser, role: 'admin', name: 'Admin Master' };
      await page.seedAuth(adminUser);

      await page.setViewport({ width: 320, height: 568 });
      // View /dashboard with admin credentials to test Header.tsx admin pill
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      const metrics = await page.evaluate(`
        (() => {
          const header = document.querySelector('header');
          const adminPill = header.querySelector('a[href="/admin/dashboard"]');
          const brand = header.querySelector('a[href="/admin/dashboard"]'); // Left brand logo also points to /admin/dashboard for admins
          const allLinks = Array.from(header.querySelectorAll('a')).map(a => ({
            href: a.getAttribute('href'),
            text: a.textContent.trim(),
            rect: a.getBoundingClientRect()
          }));

          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            allLinks,
          };
        })()
      `);

      console.log('    Metrics @ 320px Admin Header:', JSON.stringify(metrics));

      if (metrics.scrollWidth > metrics.innerWidth) {
        throw new Error(`Horizontal overflow with Admin role at 320px: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`);
      }

      // Re-seed standard ambassador user
      mockAmbassadorUser.totalPoints = 2450;
      mockDashboardData.ambassador.totalPoints = 2450;
      await page.seedAuth(mockAmbassadorUser);
    });

    // =========================================================================
    // CHALLENGE TIER 2: ALL 8 NAVIGATION LINKS IN DRAWER & SIDEBAR
    // =========================================================================
    runner.setTier('Tier 2: All 8 Navigation Links in Drawer & Sidebar');

    const expectedLinks = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Tasks', path: '/tasks' },
      { name: 'About & Rewards', path: '/about' },
      { name: 'Leaderboard', path: '/leaderboard' },
      { name: 'My Sales', path: '/my-sales' },
      { name: 'My Points', path: '/my-points' },
      { name: 'Profile', path: '/profile' },
      { name: 'Admin', path: '/admin/dashboard' },
    ];

    await runner.runTest('2.1: Mobile Drawer renders all 8 exact navigation links with icons & score badge', async () => {
      await page.setViewport({ width: 360, height: 640 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(350);

      const drawerLinks = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('div[data-testid="mobile-drawer"]');
          const links = Array.from(drawer.querySelectorAll('nav a')).map(a => {
            const path = a.getAttribute('href');
            const fullText = a.textContent.trim();
            const hasSvg = !!a.querySelector('svg');
            const scoreBadge = a.querySelector('span.rounded-full');
            return {
              path,
              fullText,
              hasSvg,
              badgeText: scoreBadge ? scoreBadge.textContent.trim() : null
            };
          });
          return links;
        })()
      `);

      if (drawerLinks.length !== 8) {
        throw new Error(`Expected exactly 8 links in mobile drawer, found: ${drawerLinks.length}`);
      }

      for (const exp of expectedLinks) {
        const item = drawerLinks.find((l) => l.path === exp.path);
        if (!item) {
          throw new Error(`Missing expected path "${exp.path}" in drawer links: ${JSON.stringify(drawerLinks)}`);
        }
        if (!item.fullText.includes(exp.name)) {
          throw new Error(`Link "${exp.path}" does not include name "${exp.name}". Got: "${item.fullText}"`);
        }
        if (!item.hasSvg) {
          throw new Error(`Link "${exp.path}" is missing an icon SVG`);
        }
        if (exp.path === '/my-points') {
          if (!item.badgeText || !item.badgeText.includes('pts')) {
            throw new Error(`My Points link missing points badge: ${JSON.stringify(item)}`);
          }
        }
      }

      await page.click('button[aria-label="Close navigation drawer"]');
      await sleep(300);
    });

    await runner.runTest('2.2: Mobile Drawer interactive navigation and auto-close across all ambassador links', async () => {
      await page.setViewport({ width: 360, height: 640 });

      const testRoutes = ['/tasks', '/about', '/leaderboard', '/my-sales', '/my-points', '/profile', '/dashboard'];

      for (const route of testRoutes) {
        // Ensure header is loaded
        await page.waitForSelector('header', { timeout: 5000 });

        // 1. Open drawer
        await page.click('button[aria-label="Toggle navigation menu"]');
        await sleep(350);

        const isOpen = await page.evaluate(`
          document.querySelector('div[data-testid="mobile-drawer"]')?.getAttribute('data-state') === 'open'
        `);
        if (!isOpen) throw new Error(`Drawer failed to open prior to navigating to ${route}`);

        // 2. Click target nav link
        await page.click(`div[data-testid="mobile-drawer"] nav a[href="${route}"]`);
        await sleep(400);

        // Wait for page to render header after navigation
        await page.waitForSelector('header', { timeout: 5000 });

        // 3. Verify route updated
        const curPath = await page.evaluate(`window.location.pathname`);
        if (curPath !== route) {
          throw new Error(`Route mismatch: expected pathname "${route}", got "${curPath}"`);
        }

        // 4. Verify drawer automatically closed
        const drawerState = await page.evaluate(`
          (() => {
            const drawer = document.querySelector('div[data-testid="mobile-drawer"]');
            if (!drawer) return { missing: true };
            const panel = drawer.querySelector('aside');
            return {
              dataState: drawer.getAttribute('data-state'),
              isTranslateXFull: panel.classList.contains('-translate-x-full'),
              bodyOverflow: document.body.style.overflow,
            };
          })()
        `);

        if (drawerState.missing) {
          throw new Error(`Drawer component missing after navigating to ${route}`);
        }
        if (drawerState.dataState !== 'closed') {
          throw new Error(`Drawer failed to close after navigating to ${route}: data-state=${drawerState.dataState}`);
        }
        if (!drawerState.isTranslateXFull) {
          throw new Error(`Drawer panel missing -translate-x-full after navigating to ${route}`);
        }
        if (drawerState.bodyOverflow !== 'unset') {
          throw new Error(`Body overflow not restored to 'unset' after navigating to ${route}: got "${drawerState.bodyOverflow}"`);
        }
      }
    });

    await runner.runTest('2.3: Mobile Drawer self-route re-click closes drawer and restores scroll', async () => {
      await page.setViewport({ width: 360, height: 640 });
      await page.navigate(`${baseUrl}/tasks`);
      await page.waitForSelector('header', { timeout: 5000 });

      // Already on /tasks. Open drawer and click /tasks again
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      await page.click('div[data-testid="mobile-drawer"] nav a[href="/tasks"]');
      await sleep(350);

      const drawerState = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('div[data-testid="mobile-drawer"]');
          return {
            dataState: drawer.getAttribute('data-state'),
            bodyOverflow: document.body.style.overflow,
          };
        })()
      `);

      if (drawerState.dataState !== 'closed') {
        throw new Error(`Drawer failed to close on re-clicking active route /tasks: got ${drawerState.dataState}`);
      }
      if (drawerState.bodyOverflow !== 'unset') {
        throw new Error(`Body overflow not restored to 'unset' on self-route click: got "${drawerState.bodyOverflow}"`);
      }
    });

    await runner.runTest('2.4: Desktop Sidebar (1024px) renders all 8 links with active styling and persistent layout', async () => {
      await page.setViewport({ width: 1024, height: 768, mobile: false });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('aside.hidden.lg\\:block', { timeout: 5000 });

      const sidebarCheck = await page.evaluate(`
        (() => {
          const sidebar = document.querySelector('aside.hidden.lg\\\\:block');
          const hamburger = document.querySelector('button[aria-label="Toggle navigation menu"]');
          if (!sidebar) return { sidebarFound: false };
          const links = Array.from(sidebar.querySelectorAll('nav a')).map(a => ({
            name: a.querySelector('span')?.textContent.trim() || '',
            path: a.getAttribute('href'),
            isActive: a.classList.contains('bg-blue-50'),
            hasSvg: !!a.querySelector('svg'),
          }));

          return {
            sidebarFound: true,
            sidebarVisible: sidebar.offsetParent !== null,
            hamburgerVisible: hamburger ? hamburger.offsetParent !== null : false,
            linksCount: links.length,
            links: links,
          };
        })()
      `);

      if (!sidebarCheck.sidebarFound || !sidebarCheck.sidebarVisible) {
        throw new Error('Desktop sidebar aside.hidden.lg:block should be visible at 1024px');
      }
      if (sidebarCheck.hamburgerVisible) {
        throw new Error('Hamburger button should be hidden at 1024px desktop breakpoint');
      }
      if (sidebarCheck.linksCount !== 8) {
        throw new Error(`Desktop sidebar should have 8 links, found: ${sidebarCheck.linksCount}`);
      }

      for (const exp of expectedLinks) {
        const found = sidebarCheck.links.find((l) => l.path === exp.path);
        if (!found) throw new Error(`Missing expected sidebar link: "${exp.path}"`);
        if (found.name !== exp.name) throw new Error(`Link name mismatch: expected "${exp.name}", got "${found.name}"`);
        if (!found.hasSvg) throw new Error(`Sidebar link "${exp.path}" missing SVG icon`);
      }

      // Check active link styling on /dashboard
      const dashboardLink = sidebarCheck.links.find((l) => l.path === '/dashboard');
      if (!dashboardLink.isActive) {
        throw new Error('Dashboard link should be styled active (bg-blue-50) when on /dashboard');
      }

      // Click /leaderboard in sidebar and verify active class switches
      await page.click('aside.hidden.lg\\:block nav a[href="/leaderboard"]');
      await sleep(500);
      await page.waitForSelector('aside.hidden.lg\\:block', { timeout: 5000 });

      const activeCheck = await page.evaluate(`
        (() => {
          const sidebar = document.querySelector('aside.hidden.lg\\\\:block');
          if (!sidebar) return { sidebarFound: false };
          const activeLink = sidebar.querySelector('nav a.bg-blue-50');
          return {
            sidebarFound: true,
            currentPath: window.location.pathname,
            activePath: activeLink ? activeLink.getAttribute('href') : null,
          };
        })()
      `);

      if (!activeCheck.sidebarFound) {
        throw new Error('Desktop sidebar disappeared after navigating to /leaderboard');
      }
      if (activeCheck.currentPath !== '/leaderboard') {
        throw new Error(`Sidebar click failed to navigate: currentPath=${activeCheck.currentPath}`);
      }
      if (activeCheck.activePath !== '/leaderboard') {
        throw new Error(`Sidebar active class not updated to /leaderboard: activePath=${activeCheck.activePath}`);
      }
    });

    // =========================================================================
    // CHALLENGE TIER 3: BODY SCROLL LOCKING & CLEANUP ACROSS UNMOUNT & RESIZE
    // =========================================================================
    runner.setTier('Tier 3: Body Scroll Locking & Cleanup Lifecycle');

    await runner.runTest('3.1: Mobile Drawer open sets body overflow to "hidden"', async () => {
      await page.setViewport({ width: 360, height: 640 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      // Initial state
      const initialOverflow = await page.getBodyOverflowStyle();
      if (initialOverflow === 'hidden') {
        throw new Error(`Body overflow should not be hidden initially: got "${initialOverflow}"`);
      }

      // Open drawer
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      const openOverflow = await page.getBodyOverflowStyle();
      if (openOverflow !== 'hidden') {
        throw new Error(`Body overflow should be 'hidden' when drawer is open: got "${openOverflow}"`);
      }
    });

    await runner.runTest('3.2: Mobile Drawer close via "X" button restores body overflow to "unset"', async () => {
      await page.click('button[aria-label="Close navigation drawer"]');
      await sleep(300);

      const closedOverflow = await page.getBodyOverflowStyle();
      if (closedOverflow !== 'unset') {
        throw new Error(`Body overflow not restored to 'unset' after clicking X button: got "${closedOverflow}"`);
      }
    });

    await runner.runTest('3.3: Mobile Drawer close via backdrop click restores body overflow to "unset"', async () => {
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      await page.click('div[aria-label="Close navigation backdrop"]');
      await sleep(300);

      const closedOverflow = await page.getBodyOverflowStyle();
      if (closedOverflow !== 'unset') {
        throw new Error(`Body overflow not restored to 'unset' after backdrop click: got "${closedOverflow}"`);
      }
    });

    await runner.runTest('3.4: Mobile Drawer close via Escape key restores body overflow to "unset"', async () => {
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      await page.pressEscape();
      await sleep(300);

      const closedOverflow = await page.getBodyOverflowStyle();
      if (closedOverflow !== 'unset') {
        throw new Error(`Body overflow not restored to 'unset' after Escape key: got "${closedOverflow}"`);
      }
    });

    await runner.runTest('3.5: Body scroll lock cleanup when Header unmounts while drawer is open', async () => {
      await page.setViewport({ width: 360, height: 640 });
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });

      // Open mobile drawer -> overflow: hidden
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      const openOverflow = await page.getBodyOverflowStyle();
      if (openOverflow !== 'hidden') {
        throw new Error(`Expected body overflow 'hidden' prior to unmount test, got: "${openOverflow}"`);
      }

      // Trigger navigation to /login, which unmounts Header entirely
      await page.evaluate(`window.location.href = '/login';`);
      await sleep(1000);
      await page.waitForSelector('form', { timeout: 5000 });

      // Verify Header is unmounted and body scroll is cleanly unlocked
      const unmountState = await page.evaluate(`
        (() => {
          return {
            hasHeader: !!document.querySelector('header'),
            bodyOverflow: document.body.style.overflow,
            path: window.location.pathname,
          };
        })()
      `);

      if (unmountState.hasHeader) {
        throw new Error('Header should be unmounted on /login');
      }
      if (unmountState.bodyOverflow !== 'unset' && unmountState.bodyOverflow !== '') {
        throw new Error(`Body overflow not restored after Header unmounted: got "${unmountState.bodyOverflow}"`);
      }

      // Re-seed auth and navigate back to /dashboard for next tests
      await page.seedAuth(mockAmbassadorUser);
      await page.navigate(`${baseUrl}/dashboard`);
      await page.waitForSelector('header', { timeout: 5000 });
    });

    await runner.runTest('3.6: Cross-breakpoint resize from 360px to 1024px closes drawer and restores scroll', async () => {
      await page.setViewport({ width: 360, height: 640 });
      await sleep(200);

      // Open drawer at 360px
      await page.click('button[aria-label="Toggle navigation menu"]');
      await sleep(300);

      const openState = await page.evaluate(`
        document.querySelector('div[data-testid="mobile-drawer"]').getAttribute('data-state')
      `);
      if (openState !== 'open') throw new Error('Drawer failed to open at 360px');

      // Resize to 1024px desktop
      await page.setViewport({ width: 1024, height: 768, mobile: false });
      await sleep(400);

      const resizeState = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('div[data-testid="mobile-drawer"]');
          return {
            dataState: drawer ? drawer.getAttribute('data-state') : null,
            bodyOverflow: document.body.style.overflow,
          };
        })()
      `);

      if (resizeState.dataState !== 'closed') {
        throw new Error(`Drawer should auto-close when resizing to >=1024px: got data-state=${resizeState.dataState}`);
      }
      if (resizeState.bodyOverflow !== 'unset') {
        throw new Error(`Body overflow should be restored to 'unset' on resize to desktop: got "${resizeState.bodyOverflow}"`);
      }

      // Resize back to 360px -> drawer must remain closed
      await page.setViewport({ width: 360, height: 640, mobile: true });
      await sleep(300);

      const backToMobileState = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('div[data-testid="mobile-drawer"]');
          return {
            dataState: drawer ? drawer.getAttribute('data-state') : null,
            bodyOverflow: document.body.style.overflow,
          };
        })()
      `);

      if (backToMobileState.dataState !== 'closed') {
        throw new Error(`Drawer should remain closed when resizing back to mobile: got data-state=${backToMobileState.dataState}`);
      }
      if (backToMobileState.bodyOverflow !== 'unset') {
        throw new Error(`Body overflow should remain 'unset': got "${backToMobileState.bodyOverflow}"`);
      }
    });

    await runner.runTest('3.7: Rapid sequential toggle stress test (10 cycles) - Synchronization & Resilience', async () => {
      await page.setViewport({ width: 360, height: 640 });
      await page.waitForSelector('header', { timeout: 5000 });

      // Sequentially toggle 10 times with 150ms pauses (allowing React state & transitions to commit)
      for (let i = 0; i < 10; i++) {
        await page.click('button[aria-label="Toggle navigation menu"]');
        await sleep(150);
      }

      // 10 toggles from initial closed state should return to closed state
      const rapidState = await page.evaluate(`
        (() => {
          const drawer = document.querySelector('div[data-testid="mobile-drawer"]');
          const panel = drawer.querySelector('aside');
          return {
            dataState: drawer.getAttribute('data-state'),
            isTranslateXFull: panel.classList.contains('-translate-x-full'),
            bodyOverflow: document.body.style.overflow,
          };
        })()
      `);

      console.log('    Metrics @ Sequential toggle (10 cycles):', JSON.stringify(rapidState));

      if (rapidState.dataState !== 'closed') {
        throw new Error(`Sequential toggle (10 clicks) expected closed drawer, got: ${rapidState.dataState}`);
      }
      if (!rapidState.isTranslateXFull) {
        throw new Error(`Sequential toggle panel missing -translate-x-full class`);
      }
      if (rapidState.bodyOverflow !== 'unset') {
        throw new Error(`Sequential toggle desynchronized body overflow: expected 'unset', got "${rapidState.bodyOverflow}"`);
      }
    });

    const summary = runner.summary();
    await browser.close();
    if (serverInfo.spawned) {
      await serverInfo.teardown();
    }
    return summary;
  } catch (err) {
    if (browser) await browser.close();
    if (serverInfo?.spawned) await serverInfo.teardown();
    throw err;
  }
}

if (process.argv[1] && process.argv[1].includes('challenger-m1-2.test.mjs')) {
  console.log('Starting Challenger 2 Test Execution...');
  runChallengerTests()
    .then((summary) => {
      if (summary.failed > 0) {
        console.error(`CHALLENGER_EXECUTION_FAILED: ${summary.failed} challenge(s) failed.`);
        process.exit(1);
      } else {
        console.log('CHALLENGER_EXECUTION_SUCCESS: All challenges passed with 100% success!');
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('CHALLENGER_EXECUTION_FATAL:', err);
      process.exit(1);
    });
}
