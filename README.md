# @zerotrace-solutions/complaint-request-widget

Production-ready React complaint widget library for Tailwind + shadcn hosts.

## Features

- Floating support bubble with direction-aware side alignment.
- WhatsApp quick action and complaint panel action.
- Selection mode that targets arbitrary DOM elements without mutating target styles.
- Metadata-rich complaint payloads (selector, label, rect, URL, lang, direction, timestamp).
- Configurable API endpoint or custom request adapter.
- i18n namespace `complaintRequestWidget` with default `en` and `ar` templates.
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
  --component-ext tsx \
  --package-name @zerotrace-solutions/complaint-request-widget \
  --install
```

The initializer is idempotent and non-destructive:

- Creates `src/components/ui/complaint-widget.tsx` by default, or `.jsx` when `--component-ext jsx` is used.
- Does not create locale JSON files.
- Does not auto-edit your host i18n config file.
- Detects missing recommended dependencies (`react`, `react-dom`, `tailwindcss`) and can install them.

## Usage

```tsx
import { ComplaintRequestWidget } from "@zerotrace-solutions/complaint-request-widget";
import i18n from "@/i18n";

export function Page() {
  return (
    <ComplaintRequestWidget
      whatsappUrl="https://wa.me/201000000000"
      apiEndpoint="/api/complaints"
      i18n={i18n}
      locale="en"
      direction="auto"
      side="auto"
    />
  );
}
```

When `i18n` is provided, the widget tracks the current client-side language from that instance and uses it for message fallback (`en`/`ar`) and payload metadata.

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

## Endpoint Payload

When `apiEndpoint` is used, the widget sends:

- Method: `POST`
- Header: `Content-Type: application/json`
- Body: JSON object with this exact shape

```ts
type ComplaintPayload = {
  body: string;
  selectedElement: {
    selector: string;
    label: string;
    tagName: string;
    className: string;
    textPreview: string;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    pageUrl: string;
  } | null;
  page: {
    title: string;
    url: string;
    language: string;
    direction: "ltr" | "rtl";
  };
  createdAt: string; // ISO datetime
};
```

Example payload:

```json
{
  "body": "The submit button does not work",
  "selectedElement": {
    "selector": "button.btn.btn-primary:nth-of-type(2)",
    "label": "Submit",
    "tagName": "button",
    "className": "btn btn-primary",
    "textPreview": "Submit",
    "rect": {
      "x": 874,
      "y": 642,
      "width": 104,
      "height": 40
    },
    "pageUrl": "https://example.com/checkout"
  },
  "page": {
    "title": "Checkout",
    "url": "https://example.com/checkout",
    "language": "en",
    "direction": "ltr"
  },
  "createdAt": "2026-03-23T10:24:13.001Z"
}
```

Notes:

- `selectedElement` is `null` when the user submits without selecting an element.
- `body` is sanitized before sending and trimmed to a maximum of 4000 characters.

Control panel size directly:

```tsx
<ComplaintRequestWidget
  whatsappUrl="https://wa.me/201000000000"
  panelWidth={420}
  panelHeight={520}
/>
```

`panelWidth` and `panelHeight` accept any React CSS size value (number, `px`, `%`, `vw`, etc.).

Control launcher and action icon sizes:

```tsx
<ComplaintRequestWidget
  whatsappUrl="https://wa.me/201000000000"
  triggerButtonSize={64}
  triggerIconSize={28}
  actionButtonSize={52}
  actionIconSize={22}
/>
```

- `triggerButtonSize`: main floating launcher button width/height
- `triggerIconSize`: icon inside the main launcher button
- `actionButtonSize`: width/height of WhatsApp, select, and complaint action buttons
- `actionIconSize`: icons inside those action buttons

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

Namespace: `complaintRequestWidget`

Backward compatibility: the widget also resolves the legacy typo namespace `complaintRequrestWidget`.

Default locale templates exported from package:

```ts
import { defaultArMessages, defaultEnMessages, WIDGET_NAMESPACE } from "@zerotrace-solutions/complaint-request-widget";
```

Runtime localization options:

- `locale` chooses default language template (`ar` uses Arabic defaults).
- `i18n` lets the host pass its i18next instance directly; widget listens for `languageChanged`.
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
