// Screenshots for the report (Sections 6 and 8). Needs Playwright and a local server on :8765 serving web/.
// Usage: node scripts/report_figs.js   -> report/figs/interface.png, scenario1_*.png, scenario2_*.png
const { chromium } = require("playwright");
const path = require("path");
const out = path.join(__dirname, "..", "report", "figs");

async function runIndexByRun(p, tool, run) {
  // index of the circle in V5 for the given run (V5 shows the selected tool, circles in run order)
  return p.$$eval("#v5 circle", (cs) => cs.length).then(() => run - 1);
}

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

  // Fig. 2: whole interface, E1 selected, a run of layer 15 open in V6
  await clickRun(443);
  await p.mouse.move(5, 5);
  await p.screenshot({ path: path.join(out, "interface.png"), fullPage: true });

  // Scenario 1: signal alarm calibrated on the other machines (V2) + feature vs wear (V4)
  await p.click('#v2-mode button[data-mode="signal"]');
  await p.waitForTimeout(600);
  await p.mouse.move(5, 5);
  await (await p.$("#v2")).screenshot({ path: path.join(out, "scenario1_v2.png") });
  await (await p.$("#v4")).screenshot({ path: path.join(out, "scenario1_v4.png") });
  await (await p.$("#v3")).screenshot({ path: path.join(out, "scenario1_v3.png") });

  // Scenario 2: E1, pin a run of layer 14, open a run of layer 15
  await clickRun(420);
  await p.click("#v6-pin");
  await p.waitForTimeout(500);
  await clickRun(443);
  await p.mouse.move(5, 5);
  await (await p.$("#v5")).screenshot({ path: path.join(out, "scenario2_v5.png") });
  await (await p.$("#v6")).screenshot({ path: path.join(out, "scenario2_v6.png") });
  await b.close();
  console.log("ok");
})();
