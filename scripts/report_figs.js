// Screenshots for the report (Sections 6 and 8). Needs Playwright and a local server on :8765 serving web/.
// Usage: node scripts/report_figs.js   then   python scripts/compose_report_figs.py
// Output: report/figs/teaser.png, interface.png and raw panels report/figs/raw_*.png
const { chromium } = require("playwright");
const path = require("path");
const out = path.join(__dirname, "..", "report", "figs");

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.goto("http://localhost:8765/index.html");
  await p.waitForTimeout(2500);
  const clickRun = async (run) => {
    // circles are <1 px apart, so a mouse click hits a neighbour: dispatch the click on the exact element instead
    await p.$$eval("#v5 circle", (cs, r) => cs.find((c) => c.__data__ && c.__data__.run === r)
      .dispatchEvent(new MouseEvent("click", { bubbles: true })), run);
    await p.waitForTimeout(800);
  };
  const shot = async (sel, name) => { await p.mouse.move(5, 5); await (await p.$(sel)).screenshot({ path: path.join(out, name) }); };

  // Fig. 2: whole interface, E1 selected, a run of layer 15 open in V6
  await clickRun(443);
  await p.mouse.move(5, 5);
  await p.screenshot({ path: path.join(out, "interface.png"), fullPage: true });
  for (const v of ["v1", "v3", "v4"]) await shot(`#${v}`, `raw_${v}.png`);

  // Scenario 1: the same leave-one-end-mill-out test for a fixed time per machine and for the signal alarm
  await p.click('#v2-mode button[data-mode="machineLoo"]');
  await p.waitForTimeout(600);
  await shot("#v2 .plot", "raw_s1_fixed_loo.png");
  await p.click('#v2-mode button[data-mode="signal"]');
  await p.waitForTimeout(600);
  await shot("#v2 .plot", "raw_s1_signal_other.png");
  await p.check('input[name=cal][value="loo"]');
  await p.waitForTimeout(600);
  await shot("#v2 .plot", "raw_s1_signal_loo.png");

  // Scenario 2: E1, pin a run of layer 14, open a run of layer 15 (signal alarm, leave-one-out level)
  await clickRun(420);
  await p.click("#v6-pin");
  await p.waitForTimeout(500);
  await clickRun(443);
  await shot("#v5 .plot", "raw_s2_v5.png");
  await shot("#v6 .plot svg", "raw_s2_v6.png");
  // Teaser for the VGTC template: wider viewport, interface without the footer
  const t = await b.newPage({ viewport: { width: 1760, height: 900 }, deviceScaleFactor: 2 });
  await t.goto("http://localhost:8765/index.html");
  await t.waitForTimeout(2500);
  await t.$$eval("#v5 circle", (cs) => cs.find((c) => c.__data__ && c.__data__.run === 443)
    .dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await t.waitForTimeout(1000);
  await t.mouse.move(5, 5);
  const bb = await (await t.$("main.grid")).boundingBox();
  await t.screenshot({ path: path.join(out, "teaser.png"), fullPage: true, clip: { x: 0, y: 0, width: 1760, height: bb.y + bb.height + 6 } });
  await b.close();
  console.log("ok");
})();
