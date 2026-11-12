# Componentes de terceiros

Arquivos originais e avisos de licença incorporados às bibliotecas foram preservados. Este arquivo registra procedência; não substitui as licenças dos fornecedores.

| Componente | Versão/arquivos | Origem |
| --- | --- | --- |
| Three.js | 0.128.0 em `js/vendor/` | [Projeto](https://github.com/mrdoob/three.js/tree/r128), [licença MIT](https://github.com/mrdoob/three.js/blob/r128/LICENSE) |
| GSAP | 3.15.1, núcleo, ScrollTrigger, ScrollToPlugin, DrawSVGPlugin e SplitText | [GSAP](https://gsap.com/), termos indicados nos cabeçalhos dos arquivos |
| Satoshi | WOFF2, pesos 400, 500 e 700 em `ASSETS/fonts/` | [Fontshare](https://www.fontshare.com/fonts/satoshi), [licenças](https://www.fontshare.com/licenses) |
| Clash Display | Seis OTF originais em `ASSETS/` e WOFF2 sem subset em `ASSETS/fonts/` | [Fontshare](https://www.fontshare.com/fonts/clash-display), [licenças](https://www.fontshare.com/licenses) |

URLs exatas e SHA-384 das seis bibliotecas constam de `scripts/vendor-manifest.json`. Não houve atualização das versões usadas pelo site original. MorphSVGPlugin e TextPlugin não eram utilizados e deixaram de ser carregados.

Esbuild, sharp e fonteditor-core são ferramentas de desenvolvimento fixadas em `package-lock.json`; seus pacotes não fazem parte do JavaScript entregue ao visitante. Lighthouse foi usado fora do runtime e das dependências de produção.
