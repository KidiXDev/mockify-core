# Mockify Core

Shared core library for Mockify browser extension — providing types, utilities, UI components, and page-level components used by both **Community Edition** (open source) and **Pro Edition** (with backend integration).

## Architecture

```
mockify-core/          ← This repo (git submodule)
├── src/
│   ├── types/         ← Shared TypeScript types & interfaces
│   ├── utils/         ← Helper functions (cn, storage, etc.)
│   ├── store/         ← Zustand stores
│   ├── styles/        ← Shared CSS (Tailwind theme)
│   ├── components/
│   │   ├── ui/        ← Reusable UI primitives (Button, Card, etc.)
│   │   └── providers/ ← Context providers (AlertProvider)
│   ├── pages/
│   │   ├── popup/     ← Popup App component
│   │   └── options/   ← Options App, Editor, Replay components
│   ├── background/    ← Service worker logic
│   ├── content/       ← Content script logic
│   └── injected/      ← Injected interceptor script
└── package.json
```

## Usage as Submodule

In both `mockify` (community) and `mockify-pro`:

```bash
git submodule add https://github.com/KidiXDev/mockify-core.git core
```

Then in `vite.config.ts`, add the alias:

```ts
resolve: {
  alias: {
    '@mockify-core': path.resolve(__dirname, './core/src')
  }
}
```

## Extension Points

Core components expose extension slots via props so that Pro can inject additional UI:

- **`PopupApp`**: `headerExtra`, `footerExtra` slots
- **`OptionsApp`**: `sidebarFooterExtra`, `headerExtra` slots
- **`OptionsLayout`**: Customizable sidebar and header areas

This allows Pro to add login buttons, sync indicators, and other premium features while reusing 100% of the core UI.

## License

MIT
