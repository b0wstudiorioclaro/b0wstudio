# B0w Studio

Site estático em HTML, CSS, GSAP e Three.js. Revisão final: 12/11/2026. As alterações estão no projeto local; nenhuma publicação foi feita.

- [Resultados e arquivos alterados](RELATORIO_OTIMIZACAO.md)
- [Auditoria de segurança e privacidade](RELATORIO_CONFORMIDADE.md)
- [Medições individuais e medianas](reports/lighthouse-summary.json)
- [Origem das bibliotecas e fontes](THIRD_PARTY_NOTICES.md)

## Desenvolvimento e publicação

Node.js 24 foi usado na validação:

```sh
npm ci
npm run build
npm test
npm run verify:media
npm run dev
```

O servidor atende somente em `http://127.0.0.1:4173/`; a versão minificada fica em `http://127.0.0.1:4173/__release/`. Não abrir o formulário por file://: o serviço precisa de origem HTTP/HTTPS. O servidor não aceita POSTs nem publica documentos, testes, configurações ou o diretório Git.

O build cria `dist/` com index.html, 404.html, CNAME, .nojekyll, css/, js/ e ASSETS/. CSS e JS próprios são minificados; bibliotecas fixadas mantêm seus bytes e hashes. URLs de CSS/JS recebem uma versão derivada do conteúdo, propagada aos workers e ao carregamento alternativo do 3D. O build recusa arquivos inesperados e links simbólicos em dist, sem apagá-los automaticamente.

Publicar **o conteúdo completo de dist/** como artefato do GitHub Pages. A configuração remota de publicação não foi alterada: um push de código-fonte, sozinho, não garante que o Pages use esse artefato. Não publicar a raiz com relatórios, ferramentas, .git, .env ou backups. Após publicar, conferir assets, página 404 e um envio controlado na caixa de entrada.


<<<<<<< HEAD
=======
O destinatário permanece `bowstudiorioclaro@gmail.com`. Com JavaScript, o site envia JSON por POST a `https://formsubmit.co/ajax/bowstudiorioclaro@gmail.com` e confirma o resultado dentro da página. Sem JavaScript, permanece o POST HTML ao FormSubmit com CAPTCHA e possível navegação para o provedor. O AJAX usa honeypot, sem CAPTCHA; os controles server-side do fornecedor não foram auditados.

O payload contém somente os campos e configurações esperados. Dados do contato não são gravados pelo código próprio em cookies, armazenamento local ou logs. Erros mantêm os campos e não exibem sucesso falso. O timeout é de 30 segundos, com bloqueio de envio duplicado e opção de enviar outro projeto.

O WhatsApp flutuante usa [(19) 99815-7374](https://wa.me/5519998157374), sem dados do formulário ou texto pré-preenchido. O link antigo junto ao formulário foi removido; formulário e botão de envio foram preservados.

## Manutenção

- `js/hero-loader.js` seleciona o worker ou o renderizador na thread principal. A cena em `js/hero-scene.js` e o caminho alternativo em `js/hero3d.js` devem continuar equivalentes; os testes comparam os resultados com a cena original.
- `scripts/vendor-manifest.json` registra versões, URLs e SRI. `node scripts/vendor.mjs` baixa novamente bibliotecas verificadas e fontes Satoshi do fornecedor; não é necessário para um build comum. Revise diferenças nas fontes, pois a resposta do fornecedor pode mudar.
- `node scripts/optimize-assets.cjs` gera variantes/manifesto; `node scripts/apply-assets.cjs` aplica referências. São comandos de manutenção, não etapas de publicação cotidiana.
- `npm run verify:media` compara pixels visíveis de nove conversões em resolução integral e tabelas de seis fontes Clash Display. Variantes menores têm redimensionamento, não identidade pixel a pixel com o original.
- O build atualiza os hashes da CSP. Novos fornecedores/scripts exigem revisão técnica, da política e do consentimento aplicável.

## Validação e limites

Resultado comparável local: performance 97 nos dois perfis, acessibilidade 97, boas práticas/SEO 100 e navegação agêntica 2/2. As cores foram mantidas por decisão expressa do responsável, deixando o alerta de contraste de dois títulos. Não são resultados de produção nem garantia para todos os dispositivos.

Os 31 testes automatizados passaram, cobrindo contato, consentimento, foco de modais/menu, workers, cena 3D, integridade e saída pública. As capturas do Lighthouse foram inspecionadas; a revisão visual interativa completa em navegadores/aparelhos reais permanece pendente porque a ferramenta de controle do navegador não ficou disponível nesta sessão. Veja os relatórios para as pendências externas e jurídicas.
>>>>>>> 87702d3 (Atualização do site B0W Studio)
