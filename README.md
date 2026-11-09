# b0wstudio

## Contato

- Destinatário único do formulário: `bowstudiorioclaro@gmail.com`.
- Envio nativo por `POST` para `https://formsubmit.co/bowstudiorioclaro@gmail.com`. Funciona também sem JavaScript; com JavaScript, valida os serviços e organiza os campos no e-mail. Não utiliza `fetch`, AJAX ou Web3Forms.
- Modelo de e-mail `box`, assunto identificando a empresa e resposta para o endereço informado pelo visitante.
- CAPTCHA do FormSubmit ativado, além do honeypot. O visitante pode precisar concluir a verificação antispam na página do provedor.
- WhatsApp: [(19) 99815-7374](https://wa.me/5519998157374).

Em 09/11/2026, o FormSubmit voltou a responder HTTP 200. Um POST real de teste para o destinatário retornou **Check Your Email**, informando que enviou um link **Activate Form**. É necessário abrir esse e-mail em `bowstudiorioclaro@gmail.com` (conferir também o spam) e ativar o formulário. Essa resposta confirma a solicitação de ativação, não a entrega do projeto na caixa de entrada.

Para publicar a correção, enviar `index.html` e `js/main.js` juntos à hospedagem atual (GitHub Pages). O script tem uma versão na URL para evitar cache da implementação antiga. Após a publicação e a ativação, enviar um projeto pelo navegador em `https://bowstudio.com.br/` e conferir o recebimento e o endereço de resposta na caixa da B0w.

A confirmação ou eventual erro do provedor aparece na página do próprio FormSubmit. O site não mostra sucesso antes dessa confirmação e preserva os dados ao voltar pelo navegador.

Documentação: [configuração](https://formsubmit.co/documentation), [modelos](https://formsubmit.co/email-templates) e [ativação](https://formsubmit.co/help).

## Segurança e publicação

Revisão e pendências registradas em `RELATORIO_CONFORMIDADE.md`.

- Scripts externos usam versões exatas e integridade SHA-384. Ao atualizar uma biblioteca, atualizar também seu hash; caso contrário, o navegador recusará o arquivo.
- As páginas têm uma CSP limitada a destinos de formulário, base da página, objetos incorporados e atualização de recursos HTTP. Ela não substitui uma política completa de scripts ou os cabeçalhos de segurança da hospedagem.
- No upload manual, publicar somente `index.html`, `404.html`, `css/`, `js/`, `ASSETS/` e, no GitHub Pages, `CNAME`. Não enviar `.git`, `.env`, chaves, backups, documentos internos ou pastas de configuração. `.gitignore` protege apenas novos arquivos no Git; não filtra um upload manual.
- Antes do lançamento, completar os dados reais da empresa e o prazo de retenção ainda pendentes nos textos do site e confirmar a ativação/entrega do FormSubmit.

## Verificação local

```sh
node --check js/main.js
node --test tests/*.test.cjs
```
