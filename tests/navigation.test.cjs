const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
const helpers = source.slice(source.indexOf('  function isolateDialog('), source.indexOf('  function initFloatingWhatsApp('));
const legal = source.slice(source.indexOf('  function initLegalAndCookieModals()'), source.indexOf('  function setupCanvas('));
const mobile = source.slice(source.indexOf('  function initMobileMenu()'), source.indexOf('  function initHero()'));
const navbar = source.slice(source.indexOf('  function initNavbar()'), source.indexOf('  function initMobileMenu()'));

for (const height of [900, 700]) {
  test(`navbar restores black on the sticky hero after a footer refresh (${height}px viewport)`, () => {
    const listeners = {}, refresh = {}, frames = [];
    let dark = false, click;
    const window = { scrollY: 0, innerHeight: height, addEventListener: (name, fn) => { listeners[name] = fn; },
      ScrollTrigger: { addEventListener: (name, fn) => { refresh[name] = fn; } },
      scrollTo: ({ top }) => { window.scrollY = top; listeners.scroll(); } };
    const hero = { dataset: { theme: 'light' }, getBoundingClientRect: () => ({ top: 0, bottom: height }),
      hasAttribute: () => true, focus() {} };
    const section = (top, theme) => ({ dataset: { theme }, getBoundingClientRect: () => ({ top: top - window.scrollY, bottom: top + height - window.scrollY }) });
    const sections = [hero, section(height, 'dark'), section(height * 2, 'light'), section(height * 3, 'dark')];
    const nav = { getBoundingClientRect: () => ({ height: 78 }), classList: { toggle: (_, value) => { dark = value; } } };
    const link = { getAttribute: () => '#inicio', addEventListener: (_, fn) => { click = fn; } };
    const document = { querySelector: () => nav, querySelectorAll: selector => selector.startsWith('main') ? sections : [link], getElementById: () => hero };
    const flush = () => { while (frames.length) frames.shift()(); };
    const scroll = y => { window.scrollY = y; listeners.scroll(); flush(); };
    vm.runInNewContext(`${navbar}\ninitNavbar();`, { window, document, hasGSAP: false, reduceMotion: false,
      requestAnimationFrame: fn => { frames.push(fn); return frames.length; } });
    assert.equal(dark, false, 'black navigation on the initial hero');
    scroll(height); assert.equal(dark, true, 'white navigation over a dark section covering the hero');
    scroll(height * 2); assert.equal(dark, false, 'black navigation over a light section');
    scroll(height * 3); assert.equal(dark, true, 'white navigation at the footer');
    refresh.refresh();
    scroll(0); assert.equal(dark, false, 'manual return stays black after refreshing at the footer');
    scroll(height * 3); listeners.resize();
    click({ preventDefault() {} }); flush();
    assert.equal(window.scrollY, 0);
    assert.equal(dark, false, 'home link restores black after resizing at the footer');
  });
}

function environment() {
  let doc;
  class Element {
    constructor(type = 'div', dataset = {}) {
      this.type = type; this.dataset = dataset; this.inert = false; this.hidden = false;
      this.children = []; this.listeners = {}; this.attributes = {}; this.style = {};
      const names = new Set();
      this.classList = { add: (...v) => v.forEach(n => names.add(n)), remove: (...v) => v.forEach(n => names.delete(n)), contains: n => names.has(n) };
    }
    matches(selector) { return selector.split(',').includes(this.type); }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    fire(name, extra = {}) { this.listeners[name]?.({ target: this, currentTarget: this, preventDefault() {}, ...extra }); }
    getAttribute(name) { return this.attributes[name]; }
    setAttribute(name, value) { this.attributes[name] = value; }
    focus() { doc.activeElement = this; }
    contains(element) { return element === this || this.children.some(c => c.contains(element)); }
    getClientRects() { return this.hidden ? [] : [{}]; }
    querySelector() { return this.children[0]; }
    querySelectorAll() { return this.children; }
  }
  const body = new Element('body'), root = new Element('html');
  doc = { body, documentElement: root, activeElement: null, cookie: '', listeners: {}, querySelector: () => null, querySelectorAll: () => [], addEventListener(name, fn) { this.listeners[name] = fn; }, contains: element => body.contains(element) };
  let timerId = 0;
  const timers = new Map(), storage = new Map();
  const window = {
    location: { protocol: 'https:' }, scrollY: 200, scrollTo() {},
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    requestAnimationFrame: fn => fn(), setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
    dispatchEvent() {}, matchMedia: () => ({ addEventListener() {} })
  };
  const context = vm.createContext({ document: doc, window, HTMLElement: Element, reduceMotion: false, hasGSAP: false, console, CustomEvent: class {} });
  return { Element, doc, window, context, flush: () => { for (const [id, fn] of timers) { timers.delete(id); fn(); } } };
}
test('legal dialogs isolate the background, contain keyboard focus, restore focus and survive reopening during close', () => {
  const e = environment(), { Element, doc, context, flush } = e;
  const content = new Element(), trigger = new Element('button', { legalOpen: 'privacy' }); content.children = [trigger];
  const modal = new Element('section', { legalModal: 'privacy' }); modal.hidden = true;
  const dialog = new Element(), close = new Element('button'), link = new Element('a');
  dialog.children = [close, link]; modal.children = [dialog]; modal.querySelectorAll = () => dialog.children;
  const floating = new Element('a'), alreadyInert = new Element(); alreadyInert.inert = true;
  doc.body.children = [content, modal, floating, alreadyInert];
  doc.querySelectorAll = selector => ({ '[data-legal-modal]': [modal], '[data-legal-open]': [trigger], '[data-legal-close]': [close] }[selector] || []);
  vm.runInContext(`${helpers}\n${legal}\ninitLegalAndCookieModals();`, context);
  trigger.fire('click');
  assert.equal(modal.hidden, false); assert.equal(content.inert, true); assert.equal(floating.inert, true); assert.equal(modal.inert, false);
  assert.equal(doc.activeElement, dialog);
  doc.listeners.keydown({ key: 'Tab', shiftKey: true, preventDefault() {} }); assert.equal(doc.activeElement, link);
  doc.listeners.keydown({ key: 'Tab', shiftKey: false, preventDefault() {} }); assert.equal(doc.activeElement, close);
  close.fire('click'); trigger.fire('click'); flush();
  assert.equal(modal.hidden, false); assert.equal(content.inert, true);
  doc.listeners.keydown({ key: 'Escape', preventDefault() {} }); flush();
  assert.equal(modal.hidden, true); assert.equal(content.inert, false); assert.equal(floating.inert, false); assert.equal(alreadyInert.inert, true);
  assert.equal(doc.activeElement, trigger); assert.equal(doc.body.classList.contains('legal-modal-open'), false);
});
test('mobile menu is modal, traps Tab and returns focus when Escape closes it', () => {
  const { Element, doc, context } = environment();
  const menu = new Element(), open = new Element('button'), close = new Element('button'), link = new Element('a'), page = new Element();
  menu.inert = true; menu.children = [close, link]; doc.body.children = [menu, page, open];
  doc.querySelector = s => ({ '.mobile-menu': menu, '.menu-toggle': open, '.menu-close': close }[s]);
  doc.querySelectorAll = s => s === '.mobile-links a' ? [link] : [];
  vm.runInContext(`${helpers}\n${mobile}\ninitMobileMenu();`, context);
  open.fire('click'); assert.equal(menu.inert, false); assert.equal(page.inert, true); assert.equal(doc.activeElement, close);
  doc.listeners.keydown({ key: 'Tab', shiftKey: true, preventDefault() {} }); assert.equal(doc.activeElement, link);
  doc.listeners.keydown({ key: 'Escape', preventDefault() {} });
  assert.equal(menu.inert, true); assert.equal(page.inert, false); assert.equal(doc.activeElement, open); assert.equal(open.attributes['aria-expanded'], 'false');
});
