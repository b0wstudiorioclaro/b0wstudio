const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const source = fs.readFileSync(path.join(__dirname, "../js/main.js"), "utf8");
const code = source.slice(source.indexOf("  function initContactForm()"), source.indexOf("  function initLegalAndCookieModals()"));
const formMarkup = html.match(/<form\b[^>]*data-contact-form>[\s\S]*?<\/form>/)[0];

function element() {
  const listeners = new Map();
  const classes = new Set();
  const attrs = new Map();
  return {
    disabled: false, hidden: false, textContent: "", focused: false,
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
    },
    set className(value) { classes.clear(); value.split(/\s+/).filter(Boolean).forEach(name => classes.add(name)); },
    setAttribute: (name, value) => attrs.set(name, value),
    removeAttribute: name => attrs.delete(name),
    addEventListener: (name, callback) => listeners.set(name, callback),
    fire: name => listeners.get(name)?.({ preventDefault() {} }),
    focus() { this.focused = true; }
  };
}

function openForm(fetchResponse = async () => ({ ok: true, json: async () => ({ success: "true" }) })) {
  const form = element();
  form.action = formMarkup.match(/action="([^"]+)"/)[1];
  form.valid = true;
  form.resets = 0;
  form.checkValidity = () => form.valid;
  form.reportValidity = () => { form.reported = true; };
  form.reset = () => { form.resets += 1; };
  const services = [...formMarkup.matchAll(/type="checkbox" name="Serviços\[\]" value="([^"]+)"/g)]
    .map((match, index) => Object.assign(element(), { value: match[1], checked: index < 2 }));
  const button = element();
  const label = element();
  const status = element();
  const error = element();
  const elements = new Map([
    ['[type="submit"]', button], ["[data-submit-label]", label],
    [".contact-form-status", status], [".contact-field-error", error], [".contact-services", element()]
  ]);
  form.querySelector = selector => elements.get(selector);
  form.querySelectorAll = () => services;
  const values = new Map([...formMarkup.matchAll(/type="hidden" name="([^"]+)" value="([^"]*)"/g)]
    .map(match => [match[1], match[2]]));
  values.set("_honey", "");
  values.set("Nome", "  Cliente de teste  ");
  values.set("Empresa", "  Marca teste  ");
  values.set("email", "cliente@example.com");
  values.set("Sobre o negócio", "  Primeira linha\nSegunda linha  ");
  const requests = [];
  const timers = new Map();
  let timerId = 0;
  vm.runInNewContext(`${code}\ninitContactForm();`, {
    document: { querySelector: () => form },
    window: {
      setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
      clearTimeout(id) { timers.delete(id); }
    },
    AbortController,
    FormData: class extends FormData {
      constructor() {
        super();
        for (const [key, value] of values) this.append(key, value);
        for (const service of services.filter(service => service.checked)) this.append("Serviços[]", service.value);
      }
    },
    fetch: async (url, options) => { requests.push({ url, ...options }); return fetchResponse(url, options); }
  });
  return { form, services, button, label, status, error, requests, timers, submit: () => form.fire("submit") };
}

test("contact submission sends organized data to the configured inbox with reply-to", async () => {
  const page = openForm();
  await page.submit();
  assert.equal(page.requests[0].url, "https://formsubmit.co/ajax/bowstudiorioclaro@gmail.com");
  const data = page.requests[0].body;
  assert.equal(data.get("_template"), "box");
  assert.equal(data.get("_replyto"), "cliente@example.com");
  assert.equal(data.get("_subject"), "B0w Studio | Novo projeto — Marca teste");
  assert.equal(data.get("Serviços desejados"), "Landing Pages, Identidade Visual");
  assert.equal(data.has("Serviços[]"), false);
  assert.deepEqual([...data].filter(([key]) => !key.startsWith("_")).map(([key]) => key),
    ["Nome", "Empresa", "email", "Serviços desejados", "Sobre o negócio"]);
  assert.equal(data.get("Sobre o negócio"), "Primeira linha\nSegunda linha");
  assert.equal(page.form.resets, 1);
  assert.equal(page.button.classList.contains("is-success"), true);
  assert.equal(page.timers.size, 0);
  page.form.fire("input");
  assert.equal(page.button.disabled, false);
});

test("validation prevents sending invalid fields or a project without services", async () => {
  const page = openForm();
  page.form.valid = false;
  await page.submit();
  assert.equal(page.form.reported, true);
  page.form.valid = true;
  page.services.forEach(service => { service.checked = false; });
  await page.submit();
  assert.equal(page.error.hidden, false);
  assert.equal(page.services[0].focused, true);
  assert.equal(page.requests.length, 0);
});

test("unconfirmed or failed responses preserve the form and allow retry", async () => {
  const failures = [
    async () => ({ ok: true, json: async () => ({}) }),
    async () => ({ ok: true, json: async () => null }),
    async () => ({ ok: true, json: async () => ({ success: "false" }) }),
    async () => ({ ok: true, json: async () => ({ success: false }) }),
    async () => ({ ok: false, json: async () => ({ success: true }) }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } }),
    async () => { throw new TypeError("Network failure"); }
  ];
  for (const response of failures) {
    const page = openForm(response);
    await page.submit();
    assert.equal(page.form.resets, 0);
    assert.equal(page.button.disabled, false);
    assert.equal(page.button.classList.contains("is-success"), false);
    assert.equal(page.status.classList.contains("is-error"), true);
    assert.equal(page.timers.size, 0);
  }
});

test("a pending request cannot be duplicated and timeout releases the form", async () => {
  const page = openForm((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(Object.assign(new Error("Timeout"), { name: "AbortError" })));
  }));
  const pending = page.submit();
  await page.submit();
  assert.equal(page.requests.length, 1);
  assert.equal(page.button.disabled, true);
  for (const timer of page.timers.values()) timer();
  await pending;
  assert.equal(page.form.resets, 0);
  assert.equal(page.button.disabled, false);
  assert.match(page.status.textContent, /demorou mais/);
  assert.equal(page.timers.size, 0);
});

test("WhatsApp opens the requested Brazilian number with the initial message", () => {
  const link = new URL(html.match(/class="contact-whatsapp" href="([^"]+)"/)[1]);
  assert.equal(link.origin, "https://wa.me");
  assert.equal(link.pathname, "/5519998157374");
  assert.equal(link.searchParams.get("text"), "Olá, B0w Studio! Tenho um projeto em mente.");
  assert.match(formMarkup, /type="email" name="email"[^>]*required/);
});
