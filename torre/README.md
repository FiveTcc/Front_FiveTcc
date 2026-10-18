# TORRE — Central de Chamados

Front-end em React + Vite para um sistema de gestão de chamados de TI.

## Como rodar

```bash
npm install
npm run dev
```

Para gerar a build de produção:

```bash
npm run build
npm run preview
```

## Integração

A autenticação e os dados do sistema devem ser fornecidos pela API. O navegador
mantém apenas os tokens e os dados necessários para preservar a sessão autenticada.

As telas de chamados, usuários, ambientes e relatórios aguardam a integração
com a API definida pelo projeto.

## Perfis de acesso

- **usuario** — abre chamados e acompanha o próprio histórico.
- **tecnico** e **admin** — podem mudar status e atribuir responsáveis.
- **admin** — também acessa a tela de usuários.
