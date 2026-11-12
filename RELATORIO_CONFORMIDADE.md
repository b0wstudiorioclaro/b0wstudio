# Auditoria técnica de segurança e privacidade — B0w Studio

<<<<<<< HEAD
=======
Revisão final: 12/11/2026. Substitui o estado técnico descrito em 09/11. As mudanças estão locais; não houve publicação, acesso a painéis privados ou envio real de contato nesta revisão. A análise técnica não certifica segurança integral nem conformidade jurídica.

## Arquitetura encontrada

Site estático hospedado publicamente no GitHub Pages, sem backend próprio, banco de contatos ou área administrativa. O formulário envia POST JSON para `https://formsubmit.co/ajax/bowstudiorioclaro@gmail.com`; o FormSubmit encaminha ao Gmail operacional. Sem JavaScript, envia POST HTML para `https://formsubmit.co/bowstudiorioclaro@gmail.com`.

Dados: nome, empresa, e-mail, celular com DDD, serviços e descrição do projeto. Não foi acrescentada coleta ou integração de marketing. O e-mail e telefone comerciais publicados são canais de contato, não credenciais. Não foi localizado endpoint próprio de listagem. A API de arquivo do FormSubmit documenta chave privada, que não está no frontend e não foi solicitada nem usada. [Documentação da API](https://formsubmit.co/api-documentation).

## Proteções e limites

| Tema | Implementado/verificado | Limite |
| --- | --- | --- |
| Transporte | Endpoints HTTPS e atualização de HTTP pela CSP; domínio público respondeu 200 com validação TLS normal pelo curl. | Sem auditoria integral de TLS, DNS ou registrador. |
| Payload | Lista explícita de campos; entradas extras como _cc/_webhook não são copiadas; honeypot preenchido interrompe envio. | Um atacante pode chamar o provedor diretamente. |
| Requisição | POST JSON, credenciais omitidas, cache no-store, redirecionamento rejeitado, Referer limitado à origem. | Não substitui validação, limite de tamanho e antispam de servidor. |
| Erros | Mensagens genéricas, timeout de 30 s, bloqueio de duplicação e sucesso só com resposta esperada da API. | Aceitação da API não comprova entrega na caixa. |
| Dados | Código próprio não grava contato em URL, cookies, localStorage ou logs; WhatsApp sem parâmetros pessoais. | FormSubmit/Gmail recebem dados; infraestrutura e contas não foram auditadas. |
| XSS | Saídas textuais para contato; CSP com default-src none, scripts próprios e hashes de bootstrap, sem unsafe-eval/unsafe-inline para scripts. | CSP não prova ausência de XSS. Estilos inline permanecem necessários às animações. |
| Dependências | Seis bibliotecas locais, versões exatas, SHA-384 e testes de integridade; fontes locais. | Versões mantidas por compatibilidade; futuras atualizações exigem regressão visual. Auditoria npm das ferramentas não cobre bibliotecas vendorizadas. |
| Preferências | SameSite=Lax, Secure em HTTPS, 180 dias; localStorage também valida data/expiração, sem renovar prazo na leitura. | Preferência anterior não autoriza automaticamente futuros rastreadores desconhecidos. |
| Publicação | Build permite apenas arquivos públicos e recusa saídas inesperadas/symlinks. | O deploy deve usar dist, não toda a raiz. |

A CSP restringe fontes/imagens à própria origem e dados incorporados, workers à própria origem, conexões ao site e FormSubmit, destino de formulário ao FormSubmit, e bloqueia object/base. Os hashes e referências são testados. Não há consulta a CDN de fontes/JavaScript durante a navegação normal.

O AJAX mantém `_captcha=false` para confirmação na página; o fallback HTML conserva CAPTCHA. Honeypot é uma barreira simples, não rate limiting. Não se apresentou validação de navegador como defesa server-side. O fornecedor recomenda CAPTCHA contra abuso e documenta seu fluxo AJAX. [FormSubmit](https://formsubmit.co/documentation).

O endpoint não executa uma operação autenticada pela sessão do visitante; não foi inventado token CSRF no frontend. O risco predominante é abuso de um endpoint público de envio. Origin/Referer e CORS, sozinhos, não impedem clientes automatizados.

## Credenciais e contas

A revisão dos arquivos próprios atuais não identificou chaves privadas. Uma busca histórica por padrões de chave privada, AWS, tokens GitHub e chaves privadas de API examinou 41 objetos textuais Git, sem achados nesses padrões (`.audit/secret-scan.json`). Não cobre todos os formatos de segredo, outros branches/remotes, binários ou serviços externos.

Não foram acessados mensagens, permissões da caixa, painel FormSubmit, administradores do GitHub, backups, registrador ou contratos. Autenticação multifator, recuperação, menor privilégio, desligamento de usuários e exclusão de backups dependem de conferência do responsável.

## Política, Termos e Cookies

Os textos continuam nos três modais existentes, com foco contido, Escape, retorno ao acionador e fundo inerte. Foram ajustados para refletir:

- Contato/orçamento e procedimentos preliminares a contrato, sem cadastro automático em publicidade. A hipótese jurídica precisa corresponder à operação real; o art. 7º, V trata dos procedimentos preliminares relacionados a contrato. [LGPD atualizada](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html).
- FormSubmit/Gmail, GitHub Pages, possível reCAPTCHA no envio nativo e WhatsApp/Instagram por clique. Fontes e bibliotecas passaram a ser locais.
- Ausência de analytics/pixels opcionais ativos no código próprio. Aceitar, recusar e gerenciar permanecem disponíveis. Novas integrações exigem informar finalidade/fornecedor e revisar ativação/revogação. [Guia de cookies da ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf).
- Direitos de acesso, correção, eliminação quando aplicável, informação sobre compartilhamento, oposição e canal para exercício de direitos, sem prometer exclusão incompatível com obrigações legais.
- Arquivo de submissões de 30 dias documentado pelo FormSubmit, distinguido da retenção posterior no Gmail/processos internos, ainda não definida. Não se atribuiu à caixa exclusão automática do provedor. [FormSubmit](https://formsubmit.co/documentation).
- Possibilidade de tratamento internacional, sem inventar países ou declarar contratos conformes sem verificá-los. Validar condições reais e mecanismo aplicável conforme a regulamentação vigente. [Resolução CD/ANPD nº 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024), [orientação sobre transferências](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados).

Razão social, CNPJ/endereço e prazos operacionais dependem de dados reais da empresa. Os modais sinalizam as lacunas; nenhum cadastro ou prazo interno foi inventado. Os Termos tiveram a linguagem de responsabilidade ajustada, preservando direitos legalmente assegurados. A versão final exige validação jurídica.

## Backend proposto para controles verificáveis

Manter Pages e acrescentar pequena API serverless em subdomínio próprio é compatível com a arquitetura. É uma proposta, não serviço implantado ou fornecedor já incluído no site:

1. POST com corpo limitado (exemplo: 16 KB), schema estrito de campos/tamanhos, validação server-side de e-mail/telefone e escape do template de e-mail.
2. Rate limiting compartilhado entre instâncias, limites por origem de abuso e limite global; desafio antiautomação verificado no servidor quando necessário. CORS restrito é complementar.
3. Segredos em armazenamento protegido; integração de e-mail aprovada com destinatário fixo, sem aceitar destinatário, CC ou webhook do cliente.
4. Sem listagem pública. Se houver painel, MFA e autorização por função; evitar cópia adicional em banco sem necessidade operacional.
5. Logs apenas com identificador, resultado e duração, sem corpo/nome/telefone/e-mail. Se IP for necessário ao antispam, limitar acesso e definir retenção.
6. Definir região, contrato, retenção, exclusão, acesso à caixa e incidentes antes do uso. Testar sucesso, erros, limites e recebimento com dados sintéticos.
7. Trocar a URL somente depois de validar entrega; preservar destinatário e procedimento de retorno ao serviço anterior.

GitHub Pages não executa esse backend. Não foi criada API fictícia nem escondido segredo em JavaScript. Seleção/configuração da plataforma dependem da infraestrutura da empresa e da definição do fornecedor que tratará os dados.

## Hospedagem e pendências finais

O cache público observado foi max-age=600. O projeto ganhou versionamento, mas não controla cabeçalhos do Pages sozinho. Não foi acrescentado _headers/.htaccess sem efeito nessa hospedagem. CSP via meta está ativa; frame-ancestors, HSTS, X-Content-Type-Options e Permissions-Policy dependem da camada HTTP/proxy e não foram declarados implantados. HSTS para subdomínios requer verificar HTTPS em todos. [HTTPS no GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

Os testes de formulário usam dados sintéticos/respostas simuladas: payload, honeypot, máscara, validação, erros HTTP/JSON/rede, timeout, duplicação, sucesso e reinício. Não enviam contato real. O README antigo registrava aceitação da API em 09/11; ela não foi repetida nem usada como prova de entrega nesta revisão.

Permanecem pendentes: confirmar dados jurídicos, retenção e condições internacionais; conferir contas/permissões; publicar dist; validar visualmente em dispositivos reais; verificar envio controlado na caixa operacional, inclusive spam e Reply-To. Não são atividades concluídas pelo código de frontend.
>>>>>>> 87702d3 (Atualização do site B0W Studio)
