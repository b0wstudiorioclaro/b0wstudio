# Relatório de conformidade da landing page B0w Studio

Atualização: 28 de outubro de 2026

## Escopo verificado

Revisão estática dos arquivos `index.html`, `css/style.css`, `js/main.js`, `js/hero3d.js` e `js/symbol.js` no projeto local. Não houve acesso a domínio ou infraestrutura de produção durante esta revisão.

Este relatório registra medidas técnicas implementadas e pendências. Ele não representa certificação jurídica, declaração de conformidade integral com a LGPD ou auditoria formal de segurança.

## Alterações implementadas

- Quatro links jurídicos discretos foram adicionados ao rodapé: Política de Privacidade, Termos de Serviço, Política de Cookies e Preferências de Cookies.
- Os quatro conteúdos abrem em modais na própria landing page, sem nova rota e sem mudança de URL.
- Os modais usam `role="dialog"`, `aria-modal="true"` e associação de título com `aria-labelledby`.
- Foram implementados fechamento por botão, tecla Escape e clique no fundo da sobreposição.
- Foi implementado bloqueio do scroll de fundo, preservação da posição de rolagem, restauração do foco e focus trap para navegação por teclado.
- As animações dos modais respeitam `prefers-reduced-motion`.
- O formulário agora exibe aviso de privacidade com acesso direto à política.
- As preferências de cookies são funcionais e armazenadas no navegador sob a chave `b0w_cookie_preferences_v1`.
- Um banner de consentimento é exibido quando ainda não existe uma escolha armazenada, com ações para aceitar todas as categorias, recusar opcionais ou abrir o gerenciamento detalhado.
- Categorias opcionais permanecem desativadas por padrão.
- Foi implementado um mecanismo de bloqueio para scripts marcados com `type="text/plain"` e `data-consent-category`. Esses scripts somente são ativados após autorização armazenada para a categoria correspondente.
- Foi adicionada a política de referência `strict-origin-when-cross-origin`.
- A marca textual foi mantida como B0w Studio. A logomarca e os arquivos gráficos originais não foram modificados.

## Auditoria de cookies, tracking e terceiros

Não foram encontrados no código atual:

- Google Analytics.
- Google Tag Manager.
- Meta Pixel.
- Scripts próprios de remarketing.
- Cookies próprios definidos por JavaScript.

Foram identificadas as seguintes integrações externas:

| Serviço | Momento de contato | Finalidade observada | Situação |
| --- | --- | --- | --- |
| Fontshare | Carregamento da página | Entrega de fonte | Recurso visual atual, requer revisão contratual e de privacidade |
| jsDelivr | Carregamento da página | Entrega de Three.js e plugins GSAP | Recurso funcional atual, requer revisão de dependência e privacidade |
| FormSubmit | Envio do formulário | Processamento e encaminhamento dos dados enviados | Terceiro que recebe dados pessoais após ação do usuário |
| WhatsApp | Clique no link | Canal externo de contato | O visitante deixa o site e passa a seguir as políticas do fornecedor |
| Instagram | Clique no link | Rede social externa | O visitante deixa o site e passa a seguir as políticas do fornecedor |

As escolhas do painel de cookies usam `localStorage`, não cookie. Nenhum script opcional está ativo no código atual. Autorizar uma categoria opcional não inicia rastreamento enquanto não houver um script explicitamente associado a ela.

## Formulário e dados pessoais

Dados observados no formulário:

- Nome.
- Nome da empresa.
- E-mail para contato.
- Serviços de interesse.
- Texto livre sobre o negócio.

O formulário inclui campo honeypot e validação no navegador. O envio é feito diretamente ao FormSubmit e não existe backend próprio no projeto local. A proteção, retenção e exclusão no serviço terceiro precisam ser verificadas contratualmente. O texto livre pode receber dados além do necessário; recomenda-se orientação operacional para não solicitar dados sensíveis.

## Segurança e HTTPS

Não foi possível verificar, sem domínio ou acesso à hospedagem:

- Certificado SSL/TLS válido.
- Redirecionamento HTTP para HTTPS.
- Suporte efetivo a TLS 1.2 e TLS 1.3.
- Renovação automática do certificado.
- HSTS.
- Content Security Policy entregue por cabeçalho.
- `X-Content-Type-Options`, `Permissions-Policy` e demais cabeçalhos de produção.
- Proteções e logs do servidor que receberá o site.

Não foi adicionada uma CSP por `meta` porque a política correta depende da hospedagem, dos cabeçalhos reais e de testes com Fontshare, jsDelivr e FormSubmit. A recomendação é configurar CSP e cabeçalhos na infraestrutura, testar em modo de relatório e somente depois aplicar bloqueio.

## Pendências jurídicas e operacionais

Devem ser fornecidos e validados pela B0w Studio antes da publicação definitiva dos textos:

- Razão social da responsável legal.
- CNPJ.
- Endereço cadastral.
- Definição do controlador e, se aplicável, encarregado ou canal formal de privacidade.
- Prazo interno de retenção dos contatos.
- Procedimento para atender direitos dos titulares.
- Base legal validada para cada tratamento real.
- Contratos e termos aplicáveis com FormSubmit, provedor de e mail, Fontshare, jsDelivr e demais fornecedores.
- Foro e legislação contratual aplicável aos serviços.
- Confirmação dos direitos de uso das imagens, fontes e demais ativos.
- Revisão jurídica final dos textos.

## Testes realizados no código local

- Verificação de sintaxe JavaScript.
- Verificação estrutural de abertura dos quatro modais por seus respectivos gatilhos.
- Verificação estática dos atributos ARIA dos diálogos.
- Verificação da presença de fechamento por botão e Escape.
- Verificação da lógica de focus trap e restauração de foco.
- Verificação da lógica de bloqueio e restauração da rolagem.
- Verificação do armazenamento, recusa e leitura das preferências.
- Verificação de bloqueio por categoria para scripts opcionais.
- Verificação de regras responsivas e suporte a movimento reduzido.

## Testes ainda necessários em ambiente de navegador e produção

- Teste manual completo com teclado, leitores de tela e toque.
- Teste visual em diferentes larguras e sistemas operacionais.
- Teste do envio real do formulário e do ciclo de exclusão no FormSubmit.
- Inspeção de rede e armazenamento no navegador para confirmar o comportamento dos fornecedores externos.
- Auditoria automatizada WCAG 2.2 AA e correções resultantes.
- Verificação do domínio, certificado, TLS, redirecionamentos e cabeçalhos de segurança.
- Teste de Content Security Policy antes de ativação em modo de bloqueio.

