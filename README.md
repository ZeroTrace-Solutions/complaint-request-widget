# @zerotrace-solutions/complaint-request-widget

Production-ready React complaint widget library for Tailwind + shadcn hosts.

## Features

- Floating support bubble with direction-aware side alignment.
- WhatsApp quick action and complaint panel action.
- Selection mode that targets arbitrary DOM elements without mutating target styles.
- Metadata-rich complaint payloads (selector, label, rect, URL, lang, direction, timestamp).
- Configurable API endpoint or custom request adapter.
- i18n namespace `complaintRequrestWidget` with default `en` and `ar` templates.
- Safe `init` CLI (no postinstall source mutation).

## Install

```bash
npm install @zerotrace-solutions/complaint-request-widget
```

Peer requirements:

- `react >= 18`
- `react-dom >= 18`
- Tailwind + shadcn token CSS variables recommended (`--primary`, `--foreground`, `--border`, etc.)

## Initialize Host Files

Use the explicit initializer command in your host app:

```bash
npx @zerotrace-solutions/complaint-request-widget init
```

Common options:

```bash
npx @zerotrace-solutions/complaint-request-widget init \
  --target-dir . \
  --components-path src/components/ui \
  --locale-root src/locales \
  --package-name @zerotrace-solutions/complaint-request-widget \
  --install
```

The initializer is idempotent and non-destructive:

- Creates `src/components/ui/complaint-widget.tsx` if missing.
- Merges missing keys into:
  - `src/locales/en/complaintRequrestWidget.json`
  - `src/locales/ar/complaintRequrestWidget.json`
- Preserves existing translation values.
- Detects missing recommended dependencies (`react`, `react-dom`, `tailwindcss`) and can install them.

## Usage

```tsx
import { ComplaintRequestWidget } from "@zerotrace-solutions/complaint-request-widget";

export function Page() {
  return (
    <ComplaintRequestWidget
      whatsappUrl="https://wa.me/201000000000"
      apiEndpoint="/api/complaints"
      locale="en"
      direction="auto"
      side="auto"
    />
  );
}
```

Use a custom adapter when you need full transport control:

```tsx
<ComplaintRequestWidget
  whatsappUrl="https://wa.me/201000000000"
  requestAdapter={async (payload) => {
    await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }}
/>
```

## Theming

The widget inherits host tokens by default with CSS variable fallbacks.

Override per instance using `colors`:

```tsx
<ComplaintRequestWidget
  whatsappUrl="https://wa.me/201000000000"
  colors={{
    primary: "hsl(var(--primary))",
    panelBackground: "hsl(var(--card))",
    text: "hsl(var(--foreground))",
    border: "hsl(var(--border))"
  }}
/>
```

## i18n

Namespace: `complaintRequrestWidget`

Default locale templates exported from package:

```ts
import { defaultArMessages, defaultEnMessages, WIDGET_NAMESPACE } from "@zerotrace-solutions/complaint-request-widget";
```

Runtime localization options:

- `locale` chooses default language template (`ar` uses Arabic defaults).
- `messages` overrides selected keys.
- `t(namespace, key, fallback)` plugs into host i18n function.

## Security Notes and Best Practices

- No `postinstall` or automatic source mutation.
- Element selection overlay is rendered in a separate layer; target DOM styles are untouched.
- Always validate and sanitize complaint message content server-side.
- Avoid exposing sensitive internal selectors publicly unless required.
- Send payloads over HTTPS.

## Scripts

```bash
npm run lint
npm run typecheck
npm run audit:prod
npm test
npm run test:cli-e2e
npm run smoke:consumer
npm run build
npm run changeset
npm run version-packages
npm run release
```

## Release Flow

1. Push changes to `main`.
2. Release workflow runs automatically and does all release steps:
3. Runs lint, typecheck, tests, build.
4. Auto bumps version with policy:
5. `x.0.0` -> `x.1.0` ... `x.9.0` -> `x+1.0.0`.
6. Commits updated version and lockfile.
7. Creates git tag `v<version>`.
8. Publishes package to npm (requires `NPM_TOKEN`).

Release workflow also runs a production dependency audit and publishes with npm provenance.

Detailed first-release steps and commit sequence are available in `RELEASE_CHECKLIST.md`.

## Security

Security reporting and controls are documented in `SECURITY.md`.

## Example App

A minimal manual verification host app is provided under `example/`.

```bash
cd example
npm install
npm run dev
```

In another terminal, from repo root:

```bash
npm run build
```

Then update imports in example to consume built package if needed.
