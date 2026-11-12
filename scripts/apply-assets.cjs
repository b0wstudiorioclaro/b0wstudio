const fs = require('node:fs');
const manifest = require('./assets-manifest.json');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<img\b[^>]*>/g, tag => {
  const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
  const asset = manifest.images[src];
  if (!asset) return tag;
  const sizes = src.includes('/SERVICES/')
    ? '(max-width: 700px) max(110vw, 900px), (max-width: 1100px) max(100vw, 900px), 70vw'
    : src.includes('/pillars/') ? '160px' : '(max-width: 768px) 100vw, 36vw';
  tag = tag.replace(/\s(?:width|height|srcset|sizes|decoding)="[^"]*"/g, '');
  return tag.replace('>', ` width="${asset.width}" height="${asset.height}" decoding="async" sizes="${sizes}" srcset="${asset.variants.map(v => `${v.src} ${v.width}w`).join(', ')}">`);
});
fs.writeFileSync('index.html', html);
for (const cssPath of ['css/style.css', 'css/404.css']) {
let css = fs.readFileSync(cssPath, 'utf8');
for (const [source, destination] of Object.entries(manifest.fonts)) css = css.replaceAll(`../ASSETS/${source}") format("opentype")`, `../${destination}") format("woff2")`);
if (!css.includes('Satoshi-400.woff2')) {
  css = [400, 500, 700].map(weight => `@font-face{font-family:"Satoshi";src:url("../ASSETS/fonts/Satoshi-${weight}.woff2") format("woff2");font-weight:${weight};font-style:normal;font-display:swap}`).join('\n') + '\n' + css;
}
fs.writeFileSync(cssPath, css);
}
for (const page of ['index.html', '404.html']) {
  let content = fs.readFileSync(page, 'utf8');
  content = content.replace(/  <link rel="preconnect"[^\n]*\n/g, '').replace(/  <link rel="stylesheet" href="https:\/\/api.fontshare[^\n]*\n/g, '');
  if (!content.includes('rel="preload"')) content = content.replace('  <title>', `  <link rel="preload" href="${manifest.fonts['ClashDisplay-Medium.otf']}" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="ASSETS/fonts/Satoshi-400.woff2" as="font" type="font/woff2" crossorigin>\n  <title>`);
  fs.writeFileSync(page, content);
}
