# TORRE — Central de Chamados

Front-end em **React + Vite** para um sistema de gestão de chamados de TI, feito como base para um projeto de TCC. A ideia visual é a de uma **torre de controle**: cada chamado tem um "sinal luminoso" de status (como luzes de pista) e um código no estilo de identificador de voo (`CH-2026-0001`).

## Como rodar

```bash
npm install
npm run dev
```

O Vite vai abrir em `http://localhost:5173`.

Para gerar a build de produção:

```bash
npm run build
npm run preview
```

## Contas de teste (login mockado)

Os dados ficam salvos no `localStorage` do navegador (chave `torre_db_v1`), simulando um backend. Para começar do zero, apague essa chave no DevTools ou limpe os dados do site.

| Perfil        | E-mail              | Senha         |
|---------------|----------------------|---------------|
| Administrador | admin@torre.edu      | admin123      |
| Técnico       | tecnico@torre.edu    | tecnico123    |
| Usuário       | renata@torre.edu     | usuario123    |
| Usuário       | paulo@torre.edu      | usuario123    |
| Secretário    | secretario@torre.edu | secretario123 |

## Estrutura

```
src/
  components/     Sidebar, Layout, StatusBeacon, PriorityBadge
  contexts/       AuthContext (autenticação mockada)
  pages/          Login, Dashboard, Chamados, ChamadoDetalhe, NovoChamado, Usuarios
  services/       storage.js (dados mockados) e utils.js (formatação)
  index.css       design system e estilos globais
```

## Perfis de acesso

- **usuario** — abre chamados e acompanha o próprio histórico.
- **tecnico** e **admin** — além disso, podem mudar status e atribuir responsável.
- **admin** — também vê a tela de Usuários.

## Próximos passos sugeridos para o TCC

1. Trocar `src/services/storage.js` por chamadas reais a uma API (REST ou GraphQL), mantendo a mesma assinatura de funções para não precisar tocar nas telas.
2. Adicionar autenticação real (JWT) no `AuthContext`.
3. Paginação e ordenação na listagem de chamados.
4. Anexar arquivos aos chamados (prints, logs).
5. Notificações (e-mail ou push) quando o status muda.
