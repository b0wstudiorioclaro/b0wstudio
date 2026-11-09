# Revisão de segurança e publicação — B0w Studio

Data: 9 de novembro de 2026.

## Resultado e limites

Não foram encontrados segredos privados nos arquivos atuais revisados nem um fluxo observado que insira conteúdo do visitante como HTML executável. Foram aplicados reforços no código local. Isso não é uma certificação de segurança ou de conformidade jurídica.

Escopo: HTML, JavaScript, CSS, SVGs locais, formulário, armazenamento de preferências, dependências externas e consultas públicas somente de leitura ao domínio. Não foram auditados acessos administrativos, histórico completo do Git, infraestrutura interna do FormSubmit, caixa de e-mail, backups ou todos os protocolos TLS. Não houve teste de invasão ou teste visual completo no navegador nesta revisão.

As alterações locais precisam ser publicadas. Os cabeçalhos consultados são da versão que já estava no ar.

## Verificações realizadas

| Item | Resultado observado |
| --- | --- |
| HTTPS | `https://bowstudio.com.br/` respondeu 200; validação padrão do certificado pelo curl passou, sem ignorar erros TLS. |
| HTTP | Redirecionamento 301 para HTTPS. |
| Arquivos sensíveis públicos | `/.env` e `/.git/config` responderam 404. Somente esses dois caminhos foram verificados. |
| Credenciais no código atual | Nenhuma senha, chave privada ou credencial secreta identificada na busca. A chave pública do Web3Forms não está mais no HTML. |
| Scripts | Three.js 0.128.0 e GSAP 3.15.1, incluindo os plugins. URLs exatas, SHA-384 calculado dos arquivos baixados e `crossorigin="anonymous"`. |
| Avisos conhecidos | Consulta OSV para `npm:three@0.128.0` e `npm:gsap@3.15.1` retornou resultados vazios. Ausência de avisos na base não garante ausência de falhas. |
| CDN | Os oito scripts retornaram arquivos com sucesso e cabeçalho CORS permitindo a verificação SRI. |
| Links externos | WhatsApp e Instagram usam HTTPS e `noopener noreferrer` ao abrir uma nova aba. |
| Dados do contato | Nome, empresa, e-mail, celular com DDD, serviços e descrição; POST AJAX para FormSubmit. O código próprio não grava esses dados em cookies ou localStorage. |
| Preferências | Cookie necessário com `SameSite=Lax`, `Secure` em HTTPS e validade de 180 dias, além de localStorage. Não contém dados do formulário. |
| Rastreamento | Nenhum Google Analytics, Meta Pixel ou outro script opcional ativo identificado no código próprio. Terceiros podem receber dados técnicos nas requisições. |

## Reforços aplicados

- Verificação de integridade SRI nos scripts externos em `index.html` e `404.html`.
- GSAP fixado em 3.15.1, versão resolvida pelo endereço 3.15 durante a revisão. Three.js mantido em 0.128.0 para preservar compatibilidade.
- CSP por meta com `base-uri 'none'`, `object-src 'none'` e `upgrade-insecure-requests`. Na home, `form-action` permite apenas a própria origem e `https://formsubmit.co`; na 404, nenhum formulário.
- Esta CSP é parcial: não restringe todas as fontes de scripts e não substitui uma política completa contra XSS. A restrição de base impede a alteração do destino relativo por uma tag base injetada.
- O envio foi alterado para AJAX a pedido do responsável pelo site, mantendo a confirmação na própria página. Honeypot preservado; `_captcha=false` apenas na requisição AJAX, pois a tela externa de CAPTCHA não faz parte desse fluxo. Isso reduz a proteção antispam em relação ao POST com CAPTCHA. O fallback HTML sem JavaScript mantém `_captcha=true` e a navegação para o provedor.
- Fragmentos de URL são tratados como IDs, com proteção contra codificação inválida, em vez de passados diretamente a um seletor CSS.
- `.gitignore` adicionado para evitar novos arquivos de credenciais e configurações locais no Git. Ele não remove arquivos já rastreados e não protege um upload manual.
- Avisos técnicos de HTTPS e cookies atualizados; referência ao reCAPTCHA adicionada aos textos pertinentes.

## Pendências antes de considerar o lançamento concluído

1. **Formulário:** confirmar um contato real em `bowstudiorioclaro@gmail.com`, incluindo resposta ao endereço do cliente. O teste AJAX em 09/11, com a origem do domínio, retornou HTTP 200 e `success: "true"`. Essa resposta confirma a aceitação pelo serviço, mas não comprova a entrega na caixa de entrada. Monitorar spam e abuso; para manter a confirmação no site com CAPTCHA, avaliar uma integração compatível com AJAX.
2. **Textos institucionais:** o site ainda contém indicações de razão social, CNPJ/endereço e prazo de retenção pendentes. Substituir pelos dados reais e validar os textos com quem responde pela empresa. Não foram inventados dados cadastrais.
3. **Publicação:** subir juntos os HTMLs e scripts atualizados, além dos assets existentes. No upload manual, não incluir `.git`, `.env`, chaves, backups e documentos internos. Fazer conferência visual e testar contato/WhatsApp depois da publicação.
4. **Acesso às contas:** verificar autenticação em dois fatores e recuperação do GitHub, do registrador do domínio e do Gmail. Não foi possível verificar essas configurações nesta revisão.

## Reforços que dependem da hospedagem

A resposta HTTPS consultada não apresentou `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` ou `Permissions-Policy`. Isso não equivale, isoladamente, a uma invasão ou falha crítica.

Quando houver suporte na camada de hospedagem/proxy, considerar `X-Content-Type-Options: nosniff`, uma política de permissões desativando câmera/microfone/localização quando não usados, e `Content-Security-Policy: frame-ancestors 'none'` se o site não precisar ser incorporado. A diretiva `frame-ancestors` precisa de cabeçalho HTTP; colocá-la em meta não funciona. Testar uma CSP completa em modo Report-Only antes de bloquear scripts e fontes. Não incluir subdomínios em HSTS sem verificar que todos suportam HTTPS.

Não foram adicionados arquivos `_headers` ou `.htaccess` que não seriam aplicados automaticamente pela hospedagem GitHub Pages identificada.

## Validação

- Sintaxe dos três scripts locais verificada com `node --check`.
- 17 testes locais passaram (formulário e preferências de cookies), incluindo erros HTTP/JSON/rede, timeout, bloqueio de envio duplicado, sucesso confirmado, novo projeto, máscara e validação do celular e ausência de navegação no fluxo JavaScript.
- Integridade dos nove elementos de script externos (o Three.js aparece nas duas páginas) conferida contra os oito arquivos obtidos do CDN.
- Na alteração posterior para confirmação dentro do site, foi feito um teste técnico real via AJAX. Resultado: HTTP 200, `success: "true"`.

## Referências técnicas

- [HTTPS no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [MDN — Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)
- [MDN — form-action](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action)
- [MDN — frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
- [OSV — consulta por pacote e versão](https://google.github.io/osv.dev/post-v1-query/)
- [FormSubmit — documentação](https://formsubmit.co/documentation)
