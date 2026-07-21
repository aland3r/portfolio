# Portfolio

Site pessoal, 100% estático — sem backend próprio.

## Résumé

Place your PDF at [`public/resume.pdf`](public/resume.pdf) for the homepage download link.

## Gestalt hub

- Public pages: `/`, `/bio`, `/cases`, `/products`
- Sign in: optional from nav, or required when launching a product
- Products open app dashboards directly (no per-product landing pages)

Copy [`.env.example`](.env.example) to `.env.local` for local Supabase auth.

GitHub Actions secrets for production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GESTALT_OWNER_EMAIL`.

## Stack

- [Next.js](https://nextjs.org/) (App Router) com [static export](https://nextjs.org/docs/app/guides/static-exports) (`output: 'export'`)
- React 19
- Lint com [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Gera o site estático na pasta `out/`, pronta para servir de qualquer CDN/host estático.

## Deploy

O deploy é feito via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)): a cada push na branch `main`, o workflow builda o projeto e publica a pasta `out/` no GitHub Pages.

O domínio customizado (`alander.io`) é configurado via [`public/CNAME`](public/CNAME), copiado para a raiz do build. O arquivo `public/.nojekyll` evita que o GitHub Pages ignore pastas com prefixo `_` geradas pelo Next.js (ex.: `_next/`).

Como o domínio é um domínio apex customizado (não `usuario.github.io/repo`), o projeto **não** usa `basePath`/`assetPrefix`.
