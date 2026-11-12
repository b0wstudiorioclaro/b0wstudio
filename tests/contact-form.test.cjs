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
  const listeners = new Map(), classes = new Set();
  return {
    disabled: false, hidden: false, textContent: "", focused: false, value: "", selectionStart: 0,
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
    classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n), toggle: (n, enabled) => enabled ? classes.add(n) : classes.delete(n) },
    set className(value) { classes.clear(); value.split(/\s+/).filter(Boolean).forEach(n => classes.add(n)); },
    setAttribute() {}, removeAttribute() {},
    addEventListener: (name, callback) => listeners.set(name, callback),
    fire: (name, event) => listeners.get(name)?.(event),
    focus() { this.focused = true; }
  };
}
function openForm(fetchResponse = async () => ({ ok: true, json: async () => ({ success: "true" }) })) {
  const form = element();
  form.action = formMarkup.match(/action="([^"]+)"/)[1];
  form.valid = true; form.resets = 0;
  form.checkValidity = () => form.valid && /^\([1-9][0-9]\) 9[0-9]{4}-[0-9]{4}$/.test(phone.value);
  form.reportValidity = () => { form.reported = true; };
  form.reset = () => { form.resets++; phone.value = ""; services.forEach(s => { s.checked = false; }); };
  const services = [...formMarkup.matchAll(/type="checkbox" name="Serviços\[\]" value="([^"]+)"/g)].map((m, i) => Object.assign(element(), { value: m[1], checked: i < 2 }));
  const button = element(), label = element(), status = element(), error = element(), success = element(), again = element(), name = element();
  const phone = element(); phone.value = "19998157374"; phone.selectionStart = 11;
  success.hidden = true;
  const elements = new Map([['[type="submit"]', button], ["[data-submit-label]", label], [".contact-form-status", status], [".contact-field-error", error], [".contact-services", element()], ["[data-contact-success]", success], ["[data-contact-again]", again], ['input[name="Nome"]', name]]);
  elements.set("[data-phone-input]", phone);
  form.querySelector = s => elements.get(s);
  form.querySelectorAll = () => services;
  const values = new Map([...formMarkup.matchAll(/type="hidden" name="([^"]+)" value="([^"]*)"/g)].map(m => [m[1], m[2]]));
  values.set("_honey", ""); values.set("Nome", "  Cliente de teste  "); values.set("Empresa", "  Marca teste  "); values.set("email", "cliente@example.com"); values.set("Sobre o negócio", "  Primeira linha\nSegunda linha  ");
  const requests = [], timers = new Map(); let timerId = 0;
  vm.runInNewContext(`${code}\ninitContactForm();`, {
    document: { querySelector: () => form },
    window: { setTimeout(callback) { timers.set(++timerId, callback); return timerId; }, clearTimeout(id) { timers.delete(id); } },
    AbortController,
    FormData: class extends FormData { constructor() { super(); for (const [k,v] of values) this.append(k,v); for (const s of services.filter(s => s.checked)) this.append("Serviços[]", s.value); } },
    fetch: async (url, options) => { requests.push({ url, ...options }); return fetchResponse(url, options); }
  });
  return { form, services, button, label, status, error, success, again, name, phone, requests, timers, values,
    async submit() { const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; await form.fire("submit", event); assert.equal(event.defaultPrevented, true, "Must never navigate away"); }
  };
}
test("AJAX stays on site, sends organized data to B0w and shows confirmed success", async () => {
  const page = openForm(); await page.submit();
  assert.equal(page.requests[0].url, "https://formsubmit.co/ajax/bowstudiorioclaro@gmail.com");
  assert.equal(page.requests[0].headers["Content-Type"], "application/json");
  const data = JSON.parse(page.requests[0].body);
  assert.equal(data._template, "box"); assert.equal(data._captcha, "false"); assert.equal(data._honey, "");
  assert.equal(data._replyto, "cliente@example.com"); assert.equal(data._subject, "B0w Studio | Novo projeto — Marca teste");
  assert.equal(data["Serviços desejados"], "Landing Pages, Identidade Visual");
  assert.equal(data["Sobre o negócio"], "Primeira linha\nSegunda linha");
  assert.equal(data.Celular, "(19) 99815-7374");
  assert.equal(Object.hasOwn(data, "Serviços[]"), false);
  assert.equal(page.form.resets, 1); assert.equal(page.success.hidden, false); assert.equal(page.success.focused, true);
  assert.equal(page.form.classList.contains("is-submitted"), true); assert.equal(page.timers.size, 0);
  assert.match(formMarkup, /<h4>Formulário enviado com Sucesso<\/h4>/);
});
test("invalid input and missing services do not send", async () => {
  const page = openForm(); page.form.valid = false; await page.submit(); assert.equal(page.form.reported, true);
  page.form.valid = true; page.services.forEach(s => { s.checked = false; }); await page.submit();
  assert.equal(page.error.hidden, false); assert.equal(page.services[0].focused, true); assert.equal(page.requests.length, 0);
});
test("HTTP failures, malformed responses and network errors preserve data and hide success", async () => {
  const responses = [
    async () => ({ ok: true, json: async () => ({ success: false }) }),
    async () => ({ ok: true, json: async () => ({ success: "false" }) }),
    async () => ({ ok: true, json: async () => ({}) }),
    async () => ({ ok: true, json: async () => null }),
    async () => ({ ok: false, json: async () => ({ success: true }) }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError(); } }),
    async () => { throw new TypeError("Network error"); }
  ];
  for (const response of responses) {
    const page = openForm(response); await page.submit();
    assert.equal(page.form.resets, 0); assert.equal(page.success.hidden, true); assert.equal(page.button.disabled, false);
    assert.equal(page.status.classList.contains("is-error"), true); assert.equal(page.timers.size, 0);
  }
});
test("duplicate submits are blocked and timeout releases controls", async () => {
  const page = openForm((url, {signal}) => new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error(), {name: "AbortError"})))));
  const pending = page.submit(); await page.submit(); assert.equal(page.requests.length, 1); assert.equal(page.button.disabled, true);
  for (const timer of page.timers.values()) timer(); await pending;
  assert.equal(page.form.resets, 0); assert.equal(page.button.disabled, false); assert.match(page.status.textContent, /demorou/);
});
test("success can be dismissed for a new project and does not resend automatically", async () => {
  const page = openForm(async () => ({ ok: true, json: async () => ({ success: true }) })); await page.submit(); await page.submit();
  assert.equal(page.requests.length, 1); page.again.fire("click");
  assert.equal(page.success.hidden, true); assert.equal(page.form.classList.contains("is-submitted"), false); assert.equal(page.name.focused, true);
  page.services[0].checked = true; page.phone.value = "11912345678"; await page.submit(); assert.equal(page.requests.length, 2);
});
test("phone mask supports typing, pasting with country code and clearing", () => {
  const { phone } = openForm();
  for (const [input, expected] of [
    ["1", "(1"], ["19", "(19"], ["199", "(19) 9"], ["1999815", "(19) 99815"],
    ["19998157374", "(19) 99815-7374"], ["+55 (19) 99815-7374", "(19) 99815-7374"],
    ["(55) 99999-1234", "(55) 99999-1234"], ["abc19998157374", "(19) 99815-7374"],
    ["199981573749999", "(19) 99815-7374"], ["", ""]
  ]) {
    phone.value = input; phone.selectionStart = input.length; phone.fire("input");
    assert.equal(phone.value, expected); assert.equal(phone.selectionStart, expected.length);
  }
});
test("editing phone digits preserves the caret and incomplete numbers cannot submit", async () => {
  const page = openForm();
  page.phone.value = "(19) 99815-7374"; page.phone.selectionStart = 8; page.phone.fire("input");
  assert.equal(page.phone.selectionStart, 8);
  for (const value of ["", "19998", "1933334444", "00998157374"]) {
    page.phone.value = value; await page.submit(); assert.equal(page.form.reported, true);
  }
  assert.equal(page.requests.length, 0);
  assert.match(formMarkup, /type="tel" name="Celular"[^>]*required/);
});
test("WhatsApp remains correct and the confirmation respects reduced motion", () => {
  const link = new URL(html.match(/class="whatsapp-float" href="([^"]+)"/)[1]); assert.equal(link.pathname, "/5519998157374");
  assert.equal(link.search, "");
  assert.doesNotMatch(html, /class="contact-whatsapp"/);
  assert.doesNotMatch(formMarkup, /web3forms|access_key|your@email.com|_cc/);
  const css = fs.readFileSync(path.join(__dirname, "../css/style.css"), "utf8");
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.contact-success/);
});

test("transport excludes credentials, redirects, caching and arbitrary provider fields", async () => {
  const page = openForm();
  page.values.set("_cc", "untrusted@example.invalid");
  page.values.set("_webhook", "https://example.invalid/capture");
  page.values.set("admin_token", "synthetic-test-value");
  await page.submit();
  const request = page.requests[0], data = JSON.parse(request.body);
  for (const key of ["_cc", "_webhook", "admin_token"]) assert.equal(Object.hasOwn(data, key), false);
  assert.equal(request.credentials, "omit"); assert.equal(request.cache, "no-store");
  assert.equal(request.redirect, "error"); assert.equal(request.referrerPolicy, "origin");
  assert.equal(new URL(request.url).search, "");
});

test("filled honeypot does not transmit personal data or claim delivery", async () => {
  const page = openForm(); page.values.set("_honey", "bot"); await page.submit();
  assert.equal(page.requests.length, 0); assert.equal(page.form.resets, 0); assert.equal(page.success.hidden, true);
});
