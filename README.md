# b0wstudio

## Contato

- Destinatário único do formulário: `bowstudiorioclaro@gmail.com`.
- Envio em segundo plano por `POST` JSON para `https://formsubmit.co/ajax/bowstudiorioclaro@gmail.com`, sem sair de `bowstudio.com.br`. O navegador precisa abrir a página por HTTP/HTTPS; o FormSubmit valida a origem da requisição.
- Modelo de e-mail `box`, assunto identificando a empresa e resposta para o endereço informado pelo visitante.
- Campo de celular obrigatório ao lado do e-mail, com máscara `(99) 99999-9999`, validação de DDD + 9 dígitos e suporte a colagem com `+55`. O número formatado acompanha os demais dados no e-mail.
- Honeypot preservado. No envio AJAX, `_captcha=false` evita a tela externa de CAPTCHA. Sem JavaScript, o HTML mantém o envio nativo com CAPTCHA, que pode sair do site. Para manter CAPTCHA no fluxo AJAX, seria necessária outra integração antispam compatível com essa modalidade.
- WhatsApp: [(19) 99815-7374](https://wa.me/5519998157374).

Em 09/11/2026, o teste real do endpoint AJAX, com os cabeçalhos Origin e Referer de `https://bowstudio.com.br/`, retornou HTTP 200 e `success: "true"` com a mensagem `The form was submitted successfully.` O teste confirma a aceitação pelo serviço; conferir a entrega em `bowstudiorioclaro@gmail.com`, inclusive no spam.

Para publicar a correção, enviar `index.html`, `js/main.js` e `css/style.css` juntos à hospedagem atual (GitHub Pages). O script e o CSS têm uma versão na URL para evitar cache da implementação antiga. Após a publicação, enviar um projeto pelo navegador e conferir o recebimento e o endereço de resposta na caixa da B0w.

Após confirmação explícita da API, o formulário mostra **Formulário enviado com Sucesso**, check animado, círculo e partículas sutis. A animação respeita a preferência por movimento reduzido. O botão **Enviar outro projeto** restaura o formulário. Em erros, os dados são mantidos, não há redirecionamento nem mensagem falsa de sucesso. O prazo para aguardar resposta é de 30 segundos.

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
