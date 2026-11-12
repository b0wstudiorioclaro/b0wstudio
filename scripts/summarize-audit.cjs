// Summarize the eight comparable recordings without publishing raw traces.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const runs = [], profiles = {};
for (const device of ['desktop', 'mobile']) for (const stage of ['before', 'after']) for (const run of [1, 2]) {
  const file = `.audit/final-${stage}-${device}-${run}.json`;
  const report = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  if (report.runtimeError || report.configSettings.formFactor !== device) throw new Error(`Invalid audit: ${file}`);
  const settings = report.configSettings;
  profiles[device] = { formFactor: device, throttlingMethod: settings.throttlingMethod, throttling: settings.throttling,
    screenEmulation: settings.screenEmulation, pauseAfterFcpMs: settings.pauseAfterFcpMs, pauseAfterLoadMs: settings.pauseAfterLoadMs };
  const score = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
  const metrics = Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'speed-index', 'cumulative-layout-shift', 'total-byte-weight', 'mainthread-work-breakdown']
    .map(id => [id, report.audits[id].numericValue]));
  runs.push({ device, stage, run, file, lighthouseVersion: report.lighthouseVersion, fetchTime: report.fetchTime,
    browser: report.environment.hostUserAgent, benchmarkIndex: report.environment.benchmarkIndex, score, metrics,
    consoleErrors: report.audits['errors-in-console'].details.items.length,
    agenticCriteria: report.categories['agentic-browsing'].auditRefs.filter(a => a.weight > 0).map(a => ({ id: a.id, score: report.audits[a.id].score })) });
}
const median = values => { const sorted = [...values].sort((a, b) => a - b); return (sorted[0] + sorted[1]) / 2; };
const summary = {};
for (const device of ['desktop', 'mobile']) {
  summary[device] = {};
  for (const stage of ['before', 'after']) {
    const selected = runs.filter(r => r.device === device && r.stage === stage);
    summary[device][stage] = Object.fromEntries(['score', 'metrics'].map(group => [group,
      Object.fromEntries(Object.keys(selected[0][group]).map(key => [key, median(selected.map(r => r[group][key]))]))]));
  }
}
const result = { date: '2026-11-12', sourceCommit: '1e098ec9968b1722ccc295c94cedd43b438cf384', buildVersion: '07116b4f0e0d',
  method: 'Two cold-profile runs per stage and device; identical loopback preview with gzip and max-age=600; six-second observation; before=original source, after=dist. Not production measurements.',
  units: 'Timing values in milliseconds; CLS unitless; total-byte-weight in bytes; scores 0–100.', profiles, summary, runs };
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/lighthouse-summary.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log('Wrote reports/lighthouse-summary.json (8 runs).');
