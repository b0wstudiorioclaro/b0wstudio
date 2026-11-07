const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "../js/main.js"), "utf8");
const consentCode = source.slice(source.indexOf("  function initLegalAndCookieModals()"), source.indexOf("  function setupCanvas("));
const key = "b0w_cookie_preferences_v1";
const categories = ["analytics", "functional", "marketing"];
const savedValue = (enabled) => ({ version: 1, necessary: true, analytics: enabled, functional: enabled, marketing: enabled, updatedAt: "2026-11-01T00:00:00.000Z" });

function element(dataset = {}) {
  const listeners = new Map();
  const classes = new Set();
  return {
    dataset, hidden: true, checked: false, textContent: "",
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
    addEventListener: (name, callback) => listeners.set(name, callback),
    fire: (name) => listeners.get(name)?.({ preventDefault() {} })
  };
}

// Recreate a page using the real consent initializer and persistent browser stores.
function openPage(state = { local: new Map(), cookies: new Map() }, options = {}) {
  const controls = categories.map((cookieCategory) => element({ cookieCategory }));
  const banner = element();
  const form = element();
  form.querySelectorAll = () => controls;
  const elements = new Map([
    ["[data-cookie-banner]", banner], ["[data-cookie-form]", form],
    ...["status", "banner-status", "reject", "banner-reject", "accept-all"].map((name) => [`[data-cookie-${name}]`, element()])
  ]);
  const timers = [];
  const events = [];
  const cookieWrites = [];
  const document = {
    querySelector: (selector) => elements.get(selector) || null,
    querySelectorAll: (selector) => {
      if (selector === "[data-legal-modal]") return [element({ legalModal: "preferences" })];
      if (selector === "[data-cookie-category]") return controls;
      return [];
    },
    addEventListener() {},
    get cookie() { return options.blockCookies ? "" : [...state.cookies].map(([name, value]) => `${name}=${value}`).join("; "); },
    set cookie(value) {
      cookieWrites.push(value);
      if (options.blockCookies) return;
      const pair = value.split(";", 1)[0];
      const separator = pair.indexOf("=");
      state.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  };
  const window = {
    location: { protocol: options.protocol || "https:" },
    localStorage: {
      getItem(name) { if (options.blockLocal) throw new Error("Storage blocked"); return state.local.get(name) ?? null; },
      setItem(name, value) { if (options.blockLocal) throw new Error("Storage blocked"); state.local.set(name, value); }
    },
    setTimeout: (callback) => timers.push(callback),
    requestAnimationFrame: (callback) => callback(),
    dispatchEvent: (event) => events.push(event)
  };
  const flush = () => { while (timers.length) timers.shift()(); };
  const context = vm.createContext({ window, document, reduceMotion: false, console, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } } });
  vm.runInContext(`${consentCode}\ninitLegalAndCookieModals();`, context);
  flush();
  return {
    state, banner, controls, form, events, cookieWrites, consent: window.B0wConsent,
    status: elements.get("[data-cookie-banner-status]"),
    click(name) { elements.get(`[data-cookie-${name}]`).fire("click"); flush(); },
    submit() { form.fire("submit"); flush(); }
  };
}

test("accepting writes a persistent cookie and survives a page reload", () => {
  const page = openPage();
  assert.equal(page.banner.hidden, false);
  page.click("accept-all");
  assert.equal(page.banner.hidden, true);
  const cookie = JSON.parse(decodeURIComponent(page.state.cookies.get(key)));
  assert.equal(cookie.necessary, true);
  for (const category of categories) assert.equal(cookie[category], true);
  assert.deepEqual(cookie, JSON.parse(page.state.local.get(key)));
  assert.match(page.cookieWrites.at(-1), /; Max-Age=15552000; Path=\/; SameSite=Lax; Secure$/);
  const reloaded = openPage(page.state);
  assert.equal(reloaded.banner.hidden, true);
  for (const input of reloaded.controls) assert.equal(input.checked, true);
});

test("existing Local Storage choices are migrated without another prompt", () => {
  const state = { local: new Map([[key, JSON.stringify(savedValue(true))]]), cookies: new Map() };
  const page = openPage(state);
  assert.equal(page.banner.hidden, true);
  assert.ok(state.cookies.has(key));
  assert.equal(page.consent.has("marketing"), true);
});

test("cookies preserve consent when Local Storage is blocked", () => {
  const page = openPage(undefined, { blockLocal: true });
  page.click("accept-all");
  assert.equal(page.banner.hidden, true);
  assert.equal(openPage(page.state, { blockLocal: true }).consent.has("analytics"), true);
});

test("Local Storage remains available when cookies are blocked", () => {
  const page = openPage(undefined, { blockCookies: true });
  page.click("accept-all");
  assert.equal(openPage(page.state, { blockCookies: true }).banner.hidden, true);
});

test("failed writes keep the banner visible and explain the failure", () => {
  const page = openPage(undefined, { blockLocal: true, blockCookies: true });
  page.click("accept-all");
  assert.equal(page.banner.hidden, false);
  assert.match(page.status.textContent, /Não foi possível salvar/);
  assert.equal(page.events.length, 0);
  assert.equal(page.consent.has("marketing"), false);
});

test("custom choices and rejection update both stores", () => {
  const page = openPage();
  page.controls[1].checked = true;
  page.submit();
  const reloaded = openPage(page.state);
  assert.equal(reloaded.consent.has("functional"), true);
  assert.equal(reloaded.consent.has("analytics"), false);
  reloaded.click("reject");
  const rejected = JSON.parse(decodeURIComponent(page.state.cookies.get(key)));
  for (const category of categories) assert.equal(rejected[category], false);
  assert.equal(openPage(page.state).banner.hidden, true);
});

test("invalid stored data does not hide the choice banner", () => {
  for (const invalid of ["broken", "null", JSON.stringify({ ...savedValue(true), version: 2 }), JSON.stringify({ ...savedValue(true), marketing: "false" })]) {
    const page = openPage({ local: new Map([[key, invalid]]), cookies: new Map() });
    assert.equal(page.banner.hidden, false);
    assert.equal(page.consent.has("marketing"), false);
  }
});

test("the newest saved choice wins and repairs the older record", () => {
  const newer = { ...savedValue(false), updatedAt: "2026-11-02T00:00:00.000Z" };
  for (const cookieIsNewer of [true, false]) {
    const state = {
      local: new Map([[key, JSON.stringify(cookieIsNewer ? savedValue(true) : newer)]]),
      cookies: new Map([[key, encodeURIComponent(JSON.stringify(cookieIsNewer ? newer : savedValue(true)))]])
    };
    const page = openPage(state);
    assert.equal(page.consent.has("marketing"), false);
    assert.equal(state.local.get(key), decodeURIComponent(state.cookies.get(key)));
  }
});

test("local HTTP previews write cookies without the HTTPS-only attribute", () => {
  const page = openPage(undefined, { protocol: "http:" });
  page.click("accept-all");
  assert.doesNotMatch(page.cookieWrites.at(-1), /; Secure/);
  assert.equal(page.banner.hidden, true);
});
