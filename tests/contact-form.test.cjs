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
  return {
    disabled: false, hidden: false, textContent: "", focused: false,
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
    },
    set className(value) { classes.clear(); value.split(/\s+/).filter(Boolean).forEach(name => classes.add(name)); },
    setAttribute() {}, removeAttribute() {},
    addEventListener: (name, callback) => listeners.set(name, callback),
    fire: (name, event) => listeners.get(name)?.(event),
    focus() { this.focused = true; }
  };
}

function openForm() {
  const form = element();
  form.valid = true;
  form.checkValidity = () => form.valid;
  form.reportValidity = () => { form.reported = true; };
  const services = [...formMarkup.matchAll(/type="checkbox" name="Serviços\[\]" value="([^"]+)"/g)]
    .map((match, index) => Object.assign(element(), { value: match[1], checked: index < 2 }));
  const button = element(), label = element(), status = element(), error = element();
  const elements = new Map([
    ['[type="submit"]', button], ["[data-submit-label]", label],
    [".contact-form-status", status], [".contact-field-error", error], [".contact-services", element()]
  ]);
  form.querySelector = selector => elements.get(selector);
  form.querySelectorAll = () => services;
  const data = new FormData();
  for (const match of formMarkup.matchAll(/type="hidden" name="([^"]+)" value="([^"]*)"/g)) data.set(match[1], match[2]);
  data.set("_honey", "");
  data.set("Nome", "  Cliente de teste  ");
  data.set("Empresa", "  Marca teste  ");
  data.set("email", "cliente@example.com");
  data.set("Sobre o negócio", "  Primeira linha\nSegunda linha  ");
  const timers = new Map(), windowListeners = new Map();
  let timerId = 0;
  vm.runInNewContext(`${code}\ninitContactForm();`, {
    document: { querySelector: () => form },
    window: {
      setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
      clearTimeout(id) { timers.delete(id); },
      addEventListener(name, callback) { windowListeners.set(name, callback); }
    },
    fetch() { assert.fail("Contact must use a native POST, not fetch"); }
  });
  return {
    form, services, button, label, status, error, data, timers,
    back: () => windowListeners.get("pageshow")(),
    submit() {
      const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      form.fire("submit", event);
      if (!event.defaultPrevented) {
        for (const service of services.filter(service => service.checked)) data.append("Serviços[]", service.value);
        form.fire("formdata", { formData: data });
      }
      return event;
    }
  };
}

test("valid submission preserves native POST and organizes the email payload", () => {
  const page = openForm();
  assert.equal(page.submit().defaultPrevented, false);
  assert.match(formMarkup, /action="https:\/\/formsubmit.co\/bowstudiorioclaro@gmail.com" method="POST"/);
  assert.equal(page.data.get("_template"), "box");
  assert.equal(page.data.get("_captcha"), "true");
  assert.equal(page.data.get("_url"), "https://bowstudio.com.br/");
  assert.equal(page.data.get("_replyto"), "cliente@example.com");
  assert.equal(page.data.get("_subject"), "B0w Studio | Novo projeto — Marca teste");
  assert.equal(page.data.get("Serviços desejados"), "Landing Pages, Identidade Visual");
  assert.equal(page.data.has("Serviços[]"), false);
  assert.deepEqual([...page.data].filter(([key]) => !key.startsWith("_")).map(([key]) => key),
    ["Nome", "Empresa", "email", "Serviços desejados", "Sobre o negócio"]);
  assert.equal(page.data.get("Sobre o negócio"), "Primeira linha\nSegunda linha");
  assert.equal(page.button.classList.contains("is-success"), false);
});

test("invalid fields and missing services block native submission", () => {
  const page = openForm();
  page.form.valid = false;
  assert.equal(page.submit().defaultPrevented, true);
  assert.equal(page.form.reported, true);
  page.form.valid = true;
  page.services.forEach(service => { service.checked = false; });
  assert.equal(page.submit().defaultPrevented, true);
  assert.equal(page.error.hidden, false);
  assert.equal(page.services[0].focused, true);
  assert.equal(page.button.disabled, false);
});

test("double submits are blocked and returning from the provider restores controls", () => {
  const page = openForm();
  assert.equal(page.submit().defaultPrevented, false);
  assert.equal(page.submit().defaultPrevented, true);
  assert.equal(page.button.disabled, true);
  page.back();
  assert.equal(page.button.disabled, false);
  assert.equal(page.timers.size, 0);
  assert.equal(page.status.textContent, "");
  assert.equal(page.submit().defaultPrevented, false);
});

test("a stalled navigation unlocks the form without claiming delivery or clearing data", () => {
  const page = openForm();
  page.submit();
  for (const timer of page.timers.values()) timer();
  assert.equal(page.button.disabled, false);
  assert.equal(page.button.classList.contains("is-success"), false);
  assert.equal(page.data.get("email"), "cliente@example.com");
  assert.match(page.status.textContent, /não abriu/);
});

test("HTML works without JS and WhatsApp targets the requested number", () => {
  assert.doesNotMatch(formMarkup, /web3forms|access_key|your@email.com|_cc/);
  assert.match(formMarkup, /type="email" name="email"[^>]*required/);
  assert.match(formMarkup, /name="_honey"/);
  assert.match(formMarkup, /type="submit"/);
  const link = new URL(html.match(/class="contact-whatsapp" href="([^"]+)"/)[1]);
  assert.equal(link.origin, "https://wa.me");
  assert.equal(link.pathname, "/5519998157374");
  assert.equal(link.searchParams.get("text"), "Olá, B0w Studio! Tenho um projeto em mente.");
});
