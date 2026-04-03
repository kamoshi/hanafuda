# Hanafuda Koi-Koi

Browser-based implementation of the Japanese card game Koi-Koi, built with [Lit]
web components and TypeScript. This is a port of a Java Swing desktop
application originally written in my first year of university.

## Stack

- **[Lit]** - web components
- **TypeScript** - all logic
- **[Vite]** - dev server and bundler
- **[Vitest]** - unit and integration tests

## Getting Started

```bash
deno install
deno task dev       # dev server at http://localhost:5173
deno task build     # production build → dist/
deno test          # run tests
```

## Embedding

The app is a single custom element. Point it at your asset root if cards are hosted elsewhere:

```html
<hf-app res-root="https://cdn.example.com/hanafuda/res/"></hf-app>
```

## Project structure

```
src/
  core/        # pure game logic (reducer, types, yaku, deck)
  ai/          # AI strategies (SimpleAI, AnalysisAI)
  components/  # Lit components
  store/       # observable store
  i18n/        # en / pl / ja translations
res/
  cards/       # SVG card assets
```

## Features

- Full Koi-Koi rules including yaku detection and scoring
- Two AI difficulty levels
- Parent check (Oya) round start determination
- English, Polish, Japanese UI
- Responsive layout

## License

SVG card artwork from [Wikimedia Commons][wikimedia-cards]. Created by Louie Mantia, すけじょ.
Licensed under [CC BY-SA 4.0][cc-by-sa].

[Lit]: https://lit.dev
[Vite]: https://vitejs.dev
[Vitest]: https://vitest.dev
[wikimedia-cards]: https://commons.wikimedia.org/wiki/Category:SVG_Hanafuda_with_traditional_colors_(black_border)
[cc-by-sa]: https://creativecommons.org/licenses/by-sa/4.0
