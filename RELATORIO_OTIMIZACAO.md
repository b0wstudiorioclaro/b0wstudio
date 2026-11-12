# Otimização B0w Studio — entrega técnica

Concluído localmente em 12/11/2026. Base: commit `1e098ec9968b1722ccc295c94cedd43b438cf384`. Build medido: `07116b4f0e0d`. Artefato final: `49e4b49b6ea8`; após as medições, a única mudança no conteúdo público foi retirar espaços ao fim de cinco linhas vazias do HTML, sem alteração de comportamento. A estrutura existente foi mantida; não houve publicação, commit ou envio real de formulário nesta revisão.

## Resultado medido

Lighthouse 13.6.0, Chrome Headless 157 no Windows. Duas rodadas por perfil e versão, oito medições finais no total. A tabela usa a mediana; com duas amostras, corresponde à média dos dois valores centrais.

| Métrica | Desktop antes | Desktop depois | Mobile antes | Mobile depois |
| --- | ---: | ---: | ---: | ---: |
| Performance | 88 | **97** | 67 | **97** |
| Acessibilidade | 97 | **97** | 97 | **97** |
| Boas práticas | 100 | **100** | 100 | **100** |
| SEO | 100 | **100** | 100 | **100** |
| FCP | 0,580 s | **0,250 s** | 2,320 s | **0,906 s** |
| LCP | 0,580 s | **0,443 s** | 2,320 s | **0,906 s** |
| TBT | 183 ms | **0 ms** | 893 ms | **46 ms** |
| Speed Index | 2,963 s | **1,818 s** | 8,008 s | **4,798 s** |
| CLS | 0,0251 | **0,0157** | 0,0589 | **0,0241** |

Performance individual: desktop antes 89/87, depois 97/97; mobile antes 67/67, depois 97/97. Os dois critérios aplicáveis de navegação agêntica passaram nas quatro medições finais: árvore de acessibilidade e estabilidade de layout. Não foi instalada integração administrativa ou exposição de dados para agentes.

As notas históricas fornecidas pelo responsável (desktop 60, mobile 50; TBT 6.500/11.890 ms) são referência externa. Não foram usadas para calcular ganho percentual, pois hardware, origem, cache, perfil e versão do navegador não são comprovadamente equivalentes ao ambiente desta revisão.

## Método e evidências

- Antes: cópia dos HTMLs/CSS/JS originais em `.audit/before/`, usando os assets originais. Depois: saída minificada em `dist/`. Ambos servidos pelo mesmo preview em loopback, com gzip, ETag e cache de 600 segundos; o cache reproduz o valor observado no domínio público, não uma configuração remota alterada.
- Perfis: desktop 1350×940, DPR 1, CPU 1×; mobile 412×823, DPR 1,75, CPU 4×. Rede simulada oficial de cada perfil, registrada no JSON. Perfis frios, sem bloqueio de CDN na base original; formFactor e ausência de erro de execução conferidos em cada relatório.
- Janela adicional de observação de 6 segundos após FCP/carregamento para incluir o preloader e a entrada da cena. Não há detecção de Lighthouse nem desativação de animações para medição.
- Nenhum erro de console nas oito medições. Network dos relatórios finais mostra o worker, Three.js e a cena locais carregados; o renderizador alternativo não foi necessário nesses perfis.
- [Resumo reproduzível dos dados](reports/lighthouse-summary.json). Relatórios brutos locais: `.audit/final-{before|after}-{desktop|mobile}-{1|2}.json`. Capturas finais inspecionadas: `.audit/final-desktop.png` e `.audit/final-mobile.png`.
- O script local `.audit/run-lighthouse.cjs` e sua configuração guardam o comando exato usado; `node scripts/summarize-audit.cjs` recompõe o resumo a partir dos oito JSONs. Esses arquivos brutos ficam fora do Git e do build; preserve-os se desejar repetir a auditoria a partir desta cópia de trabalho.

O LCP pode ser um elemento do preloader; não deve ser interpretado sozinho como o instante em que todo o 3D ficou pronto. As capturas finais mostram texto, logo 3D e banner, mas não comprovam cada interação. Medições locais não substituem produção, dados de usuários reais ou aparelhos físicos.

## Causas encontradas e correções

| Problema | Causa observada | Correção |
| --- | --- | --- |
| Bloqueio da interface | Construção/renderização Three.js na thread principal; o `hero3d.js` foi o maior custo de script na base. Na segunda rodada mobile, cerca de 3,37 s de trabalho atribuídos a ele. | Renderização da mesma cena por OffscreenCanvas em worker, sem limitar FPS. Thread principal envia estado, tamanho e ponteiro. |
| Compatibilidade do 3D | Nem todo navegador oferece renderização em worker. | Detecção de suporte, timeout/erro e retorno ao renderizador original; geometria também pode ser preparada em worker nesse caminho. |
| Reflow e trabalho recorrente | Medições de layout em scroll, cálculo repetido de posições e atualização contínua de elementos parados. | Cache de medidas, atualização em resize/refresh, leituras antes das escritas, agrupamento por requestAnimationFrame, cursor parando ao estabilizar. |
| Inicialização antecipada | SplitText de seções ainda distantes da viewport. | Preparação próxima da área visível por IntersectionObserver, preservando tempos/efeitos do reveal. |
| Cadeias de rede | Scripts/fontes de origens externas e OTF maiores. | Bibliotecas/fontes locais, defer ordenado e preloads seletivos; WOFF2 sem subset dos desenhos originais. |
| JS/CSS sem uso | Plugins e inicializadores antigos; regras de versões anteriores. | Remoção de MorphSVG/TextPlugin, inicializadores mortos e 224 regras/seletores obsoletos; minificação no build. |
| Imagens grandes | PNGs e ausência de variantes adequadas ao tamanho exibido. | WebP sem perda para conversões integrais vantajosas, srcset/sizes, dimensões explícitas, decode assíncrono e lazy abaixo da dobra. |
| Cache/versionamento | URLs fixas para recursos alterados e cache curto da hospedagem. | Hash de conteúdo nas URLs CSS/JS e variantes de assets; worker/fallback recebem a mesma versão. Cache HTTP longo continua dependente da hospedagem. |
| Árvore acessível | Papel de link aplicado a article e ARIA produzido pelo SplitText em spans sem semântica adequada. | Botões reais para ações dos cards e ARIA ajustado, mantendo títulos legíveis e textos decorativos fora da árvore. |
| Foco nos overlays | Navegação podia escapar de modais/menu; abertura/fechamento rápido causava disputa de estado. | Fundo inert, contenção de Tab, Escape, retorno ao acionador, foco no destino e correção da disputa de transições. |

O trabalho total de thread principal ainda existe: na segunda rodada mobile caiu de aproximadamente 8,03 s para 3,47 s no diagnóstico simulado. TBT mede apenas a parcela bloqueante e não significa que o navegador deixou de executar animações.

## Preservação visual e mídia

Nenhum arquivo original de imagem/fonte em ASSETS foi substituído ou regravado. Foram adicionadas variantes. Nove conversões em tamanho integral passaram por comparação de todos os pixels visíveis; RGB de pixels totalmente transparentes é ignorado. Seis WOFF2 Clash Display preservam tabelas de glifos, métricas e hinting, descontando apenas checksum e flag de compressão exigida pelo formato. Não houve subset. [Especificação WOFF2](https://www.w3.org/TR/WOFF2/).

Imagens JPG integrais de serviços continuam sendo usadas quando o WebP equivalente sem perda ficava maior. Variantes menores têm redimensionamento e seleção conservadora para considerar DPR, object-fit e recorte do parallax. A disponibilidade do original foi preservada. Não houve redução de qualidade de vídeo: nenhum vídeo ou Lenis estava presente nesta versão do projeto.

Geometria, materiais, luzes, sombras, câmera, DPR máximo, ritmo de rotação, scroll e interação do 3D foram mantidos. Testes com Three.js real comparam snapshots determinísticos da cena nova com a original em desktop/mobile, após animação, scroll e arraste. Isso verifica cálculos e estado; não é comparação completa de pixels da GPU em todos os navegadores. O loop pausa quando oculto/fora da viewport e mantém requestAnimationFrame normal quando visível.

GSAP, ScrollTrigger, ScrollTo, DrawSVG e SplitText foram preservados. Durações, blur, stagger e efeitos visuais ativos não foram removidos para aumentar nota. A revisão visual interativa completa permanece pendente: a ferramenta de controle do navegador ficou indisponível. As capturas do Lighthouse e os testes automatizados não autorizam afirmar validação manual integral de todas as seções/aparelhos.

## WhatsApp, formulário e privacidade

O link antigo junto ao formulário foi substituído pelo botão fixo no canto inferior direito. Reutiliza o SVG e o número existentes, com fundo transparente, mix-blend-mode difference, hover discreto, foco visível e safe area. O script detecta sobreposição com controles e banner e desloca o botão para cima; fica oculto durante menu/modal/preloader. A captura mobile confirma sua posição acima do banner de cookies. A validação em todos os fundos animados, zooms e dispositivos continua no checklist manual.

O formulário e seu submit foram mantidos, assim como destinatário, confirmação na página e fallback nativo. Foram reforçados allowlist do payload, honeypot, opções de fetch, tratamento de erros e não persistência de dados pessoais. Não foi implantado backend próprio ou inventada validação server-side. A API atual do FormSubmit permanece responsável pelo processamento.

Política, Termos e Cookies foram atualizados nos modais existentes para os fornecedores reais, coleta, finalidades, direitos, retenção conhecida do provedor e lacunas da empresa. Preferências expiram também no localStorage. Não há analytics/pixel opcional ativo. Veja [auditoria detalhada e proposta de backend](RELATORIO_CONFORMIDADE.md).

## Alertas que permanecem

- **Acessibilidade 97:** contraste aproximado 2,77:1 nos trechos cinza dos títulos de serviços/equipe, abaixo de 3:1 exigido pelo teste para texto grande. O responsável escolheu expressamente manter as cores atuais; não foi aplicado artifício para ocultar a falha.
- **Performance 97:** preloader e transições influenciam Speed Index. Não se encurtou o efeito para buscar 100. A pontuação pode variar entre execuções e dispositivos.
- **Reflow:** ainda há medições do GSAP/ScrollTrigger/SplitText, efeitos e alguns pontos próprios. O diagnóstico continua presente; otimização não equivale a eliminação total.
- **Imagens/payload:** o Lighthouse sugere compressão/redimensionamento adicional, sobretudo no desktop. Imagens sem perda, DPR e recortes preservados limitam a economia. Na segunda rodada desktop o payload observado caiu de cerca de 7,79 MB para 4,28 MB; no mobile, de 1,72 MB para 1,66 MB. O conjunto carregado varia com lazy loading/viewport.
- **CSS/cadeia de rede:** a folha principal permanece crítica à renderização para evitar flash de layout; dependências necessárias às fontes e à cena continuam existindo. O relatório ainda aponta esses diagnósticos.
- **Hospedagem e segurança:** cache longo, cabeçalhos HTTP adicionais, rate limiting/validação de servidor, permissões privadas, retenção interna e condições contratuais não foram comprovados ou implantados pelo frontend.

## Arquivos alterados/adicionados

| Arquivos | Finalidade |
| --- | --- |
| `index.html`, `404.html` | Recursos locais, CSP, imagens, semântica, modais e WhatsApp. |
| `css/style.css`, `css/404.css` | Fontes locais, limpeza segura, foco e botão flutuante. |
| `js/main.js`, `js/hero3d.js` | Animações, eventos/layout, contato, consentimento e renderização alternativa. |
| `js/hero-loader.js`, `js/hero-render-worker.js`, `js/hero-scene.js`, `js/geometry-worker.js` | Carregamento, renderização fora da thread principal e compatibilidade. |
| `js/vendor/` | Seis bibliotecas originais fixadas e verificadas. |
| `ASSETS/fonts/`, `ASSETS/optimized/` | Nove WOFF2 locais e 33 variantes WebP; originais preservados. |
| `package.json`, `package-lock.json`, `.gitignore` | Ferramentas de desenvolvimento e exclusão de auditorias/build/configurações privadas. |
| `scripts/build.cjs`, `preview.cjs`, `security-policy.cjs`, `tooling.cjs` | Build, preview restrito, CSP e resolução das ferramentas. |
| `scripts/vendor.mjs`, `vendor-manifest.json` | Download verificável e procedência das bibliotecas. |
| `scripts/optimize-assets.cjs`, `apply-assets.cjs`, `verify-media.cjs`, `assets-manifest.json` | Geração, aplicação e verificação de mídia/fontes. |
| `scripts/summarize-audit.cjs`, `reports/lighthouse-summary.json` | Evidências das oito medições e medianas. |
| `tests/contact-form.test.cjs`, `cookie-consent.test.cjs` | Ampliação dos testes existentes de envio/consentimento. |
| `tests/navigation.test.cjs`, `hero-loader.test.cjs`, `public-output.test.cjs` | Foco, compatibilidade, CSP, SRI e publicação. |
| `tests/geometry.test.cjs`, `scene.test.cjs`, `scene-harness.cjs`, `geometry-original.json`, `scene-original-desktop.json`, `scene-original-mobile.json` | Regressão contra a geometria/cena original. |
| `README.md`, `RELATORIO_CONFORMIDADE.md`, `RELATORIO_OTIMIZACAO.md`, `THIRD_PARTY_NOTICES.md` | Operação, resultados, fontes e pendências. |

## Verificações e passagem para produção

Build estático gerado com 100 arquivos; **31 testes passaram, sem falhas ou testes ignorados**. Nove imagens integrais e seis fontes passaram pela verificação de preservação. Oito medições Lighthouse finalizadas e capturas desktop/mobile inspecionadas. Os testes usam dados sintéticos. Não foram testados contatos reais, acessos administrativos ou armazenamento interno dos fornecedores.

Antes de considerar a operação finalizada em produção, publicar o artefato completo e conferir: menu e navegação por teclado; abertura/fechamento dos três modais; preferências de cookies; formulário com erro/sucesso; WhatsApp e links; scroll, arraste/toque no 3D e retorno do background; largura tablet/mobile, orientação, zoom e motion reduzido; página 404; console/network; entrega de uma mensagem sintética na caixa. Confirmar também dados jurídicos e configurações externas descritas no relatório de conformidade.
