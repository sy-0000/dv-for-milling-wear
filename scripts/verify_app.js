// Stage 8 browser check: compares numbers displayed by the app with data/verify_expected.json (from verify.py),
// and saves color-vision-deficiency screenshots. Needs Playwright + a local server on :8765 serving web/.
// Usage: node scripts/verify_app.js <output_dir>
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const exp = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "verify_expected.json")));
const out = process.argv[2] || ".";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("http://localhost:8765/index.html");
  await p.waitForTimeout(2500);
  const res = [];
  const check = (name, got, want) => res.push({ name, got, want, ok: String(got) === String(want) });

  // V2 fleet line + unused labels (default threshold 140, fleet mode)
  const fixLabel = await p.textContent("#v2 .fixline text");
  check("V2 fleet replacement time", fixLabel, `${exp.fleet_fix.toFixed(1)} min`);
  const labels = await p.$$eval("#v2 svg > g > g", (gs) => gs.filter((g) => g.querySelector("text")?.textContent?.startsWith("E"))
    .map((g) => [...g.querySelectorAll("text")].map((t) => t.textContent)));
  labels.forEach(([tool, lab]) => {
    const t = tool.match(/E(\d)/)[1];
    const u = exp.unused_pct[t];
    const want = u > 0 ? `unused ${u} %` : (lab.startsWith("replaced") ? "replaced at threshold" : "unused 0 %");
    check(`V2 ${tool}`, lab, want);
  });
  // V4 band label
  const band = await p.$$eval("#v4 text", (ts) => ts.map((t) => t.textContent).find((s) => s.startsWith("at VB")));
  const f3 = (v) => Number(v.toPrecision(3)).toString();
  check("V4 band at VB 140", band, `at VB 140 µm: ${f3(exp.band_lo)} – ${f3(exp.band_hi)} (9 tools)`);
  // V3 pooled rho of selected feature (Tsp_mean, ratio)
  const rho = await p.$$eval("#v3 g.row", (rows) => {
    const r = rows.find((x) => x.querySelector(".rl").textContent.startsWith("Spindle torque, mean"));
    const cells = [...r.querySelectorAll("g.cell text")];
    return cells[cells.length - 1].textContent;
  });
  check("V3 pooled rho Tsp_mean", rho, exp.rho_all.toFixed(2).replace("0.", "."));
  // V5 T1 flags: expect a J flag (layer 15 jump)
  const flags = await p.$$eval("#v5 text", (ts) => ts.map((t) => t.textContent).filter((s) => /^[JR]+$/.test(s)));
  check("V5 T1 has J flag", flags.includes("J") || flags.includes("JR"), true);
  // legends / axis labels present
  check("machine legend entries", await p.$$eval("#legend span", (s) => s.length), 3);
  check("V3 colour legend", (await p.$$("#v3 .legend rect")).length > 0, true);

  // signal alarm mode: calibrated on other machines, persistence 1 and 30
  await p.click('#v2-mode button[data-mode="signal"]');
  await p.waitForTimeout(500);
  const errStats = (o) => {
    const e = Object.values(o).filter((v) => v.err_min !== null).map((v) => v.err_min);
    const miss = Object.values(o).filter((v) => v.C_alarm === null).length;
    const early = e.filter((x) => x < 0).length, late = e.length - early;
    const mae = e.reduce((a, b) => a + Math.abs(b), 0) / e.length;
    return `mean |error| ${mae.toFixed(1)} min · ${early} early · ${late} late · ${miss} missed`;
  };
  let sum = await p.textContent("#v2-summary");
  check("V2 signal (other, persist 1)", sum.includes(errStats(exp.alarm_other_p1)), true);
  await p.check('input[name=cal][value="own"]');
  await p.waitForTimeout(500);
  sum = await p.textContent("#v2-summary");
  check("V2 signal (own, persist 1)", sum.includes(errStats(exp.alarm_own_p1)), true);
  await p.check('input[name=cal][value="other"]');
  await p.fill("#v2-persist", "29");
  await p.dispatchEvent("#v2-persist", "change");
  await p.waitForTimeout(500);
  sum = await p.textContent("#v2-summary");
  check("V2 signal (other, persist 29)", sum.includes(errStats(exp.alarm_other_p29)), true);
  const e1 = await p.$$eval("#v2 svg > g > g", (gs) => gs.map((g) => [...g.querySelectorAll("text")].map((t) => t.textContent))
    .find((t) => t[0] === "E1 M1"));
  const a1 = exp.alarm_other_p29["1"];
  check("V2 E1 label (other, persist 29)", e1[1], `${(-a1.err_min).toFixed(1)} min early · VB ${a1.VB_alarm}`);
  console.table(res);
  const cdp = await p.context().newCDPSession(p);
  for (const t of ["deuteranopia", "protanopia", "tritanopia"]) {
    await cdp.send("Emulation.setEmulatedVisionDeficiency", { type: t });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(out, `cvd_${t}.png`) });
  }
  console.log(errs.length ? "page errors:\n" + errs.join("\n") : "no page errors");
  console.log("OVERALL:", res.every((r) => r.ok) && !errs.length ? "PASS" : "FAIL");
  await b.close();
})();
