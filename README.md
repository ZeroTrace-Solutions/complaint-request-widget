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

## API Reference

### Component Props (`ComplaintRequestWidgetProps`)

All props are optional unless specified. The widget provides sensible defaults for each.

#### Core Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `undefined` | HTTP endpoint to POST complaint payloads to. Must be a relative path (starting with `/`) or an HTTPS/HTTP URL. When provided, overrides `requestAdapter`. |
| `requestAdapter` | `RequestAdapter` | `undefined` | Custom async function to handle complaint submission. Signature: `(payload: ComplaintPayload) => Promise<void \| AdapterResult>`. Allows full control over transport, validation, and error handling. |
| `whatsappUrl` | `string` | `undefined` | WhatsApp chat link (e.g., `https://wa.me/201000000000`). Creates a direct message action button. |
| `whatsappLink` | `string` | `undefined` | Deprecated alias for `whatsappUrl`. Use `whatsappUrl` instead. |

#### UI Layout & Positioning

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `"left" \| "right" \| "auto"` | `"auto"` | Horizontal placement of the floating launcher bubble. `"auto"` selects based on available viewport space. |
| `position` | `"left" \| "right" \| "auto"` | `"auto"` | Deprecated alias for `side`. Use `side` instead. |
| `direction` | `"ltr" \| "rtl" \| "auto"` | `"auto"` | Text direction and layout directionality. `"auto"` detects from i18n instance, `document.dir`, or defaults to `"ltr"`. |
| `panelWidth` | `number \| string` | `420` | Panel container width. Accepts CSS values: pixel numbers, `px`, `%`, `vw`, etc. |
| `panelHeight` | `number \| string` | `520` | Panel container height. Accepts CSS values: pixel numbers, `px`, `%`, `vh`, etc. |
| `zIndex` | `number` | `50` | CSS z-index stack order for launcher button and panel overlay. Ensures the widget appears above other page content. |
| `style` | `CSSProperties` | `{}` | Inline React styles applied directly to the launcher button. |

#### Button & Icon Sizing

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `triggerButtonSize` | `number \| string` | `64` | Width and height of the main floating launcher button. Accepts pixel numbers or CSS values (`px`, `%`, `vw`). |
| `triggerIconSize` | `number \| string` | `28` | Width and height of the icon inside the main launcher button. Controls visual prominence of the complaint icon. |
| `actionButtonSize` | `number \| string` | `52` | Width and height of WhatsApp, Select Element, and complaint action buttons displayed in the panel. |
| `actionIconSize` | `number \| string` | `22` | Width and height of icons inside action buttons. |
| `triggerIcon` | `ReactNode` | `<Bug />` (Lucide icon) | Custom React component or element to render as the main launcher button icon. |

#### Styling & Theming

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colors` | `WidgetColorOverrides` | `{}` | CSS custom properties for theming. Overrides host token values. Keys: `primary`, `primaryForeground`, `surface`, `surfaceForeground`, `border`, `muted`, `mutedForeground`, `ring`. Values should be CSS color strings (e.g., `"hsl(var(--primary))"`). |
| `colorScheme` | `WidgetColorOverrides` | `{}` | Deprecated alias for `colors`. Both are merged, with `colors` taking precedence. |
| `className` | `string` | `""` | Additional CSS class names to apply to the launcher button container. |
| `buttonClassName` | `string` | `""` | Additional CSS class names for the launcher button itself. |
| `panelClassName` | `string` | `""` | Additional CSS class names for the panel container. |

#### Localization & i18n

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `locale` | `string` | `"en"` | Default language code when i18n is not provided. Supports `"en"` (English) and `"ar"` (Arabic). Fallback for message templates. |
| `i18n` | `i18next I18n instance` | `undefined` | i18next instance (v21+) for runtime language detection and message loading. Widget listens for `languageChanged` events. |
| `translationNamespace` | `string` | `"complaintRequestWidget"` | Deprecated alias for `namespace`. Use `namespace` instead. |
| `namespace` | `string` | `"complaintRequestWidget"` | i18n namespace to read messages from. Also supports legacy typo namespace `complaintRequrestWidget` as fallback. |
| `messages` | `Partial<Record<TranslationKey, string>>` | `{}` | Override individual message keys at runtime. Keys from this object take precedence over i18n file messages. |
| `t` | `(namespace: string, key: TranslationKey, defaultValue: string) => string` | `undefined` | Custom translation function. Called when widget needs a message. Signature allows full control over message resolution logic. |
| `labels` | `Partial<Record<TranslationKey, string>>` | `{}` | Deprecated alias for `messages`. Both are merged, with `messages` taking precedence. |

#### Element Selection & Callbacks

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectionRootSelector` | `string` | `"body"` | DOM selector for the root element wherein users can select child elements. Restricts selection to descendants of this node. Useful for limiting selection to a specific page region. |
| `onNavigateToSelected` | `(selectedElement: SelectedElementMetadata) => Promise<void> \| void` | `undefined` | Optional callback fired when user clicks the "Navigate to Selected" action. Receives the selected element metadata. Supports both async and sync functions. |

---

### Translation Keys (`TranslationKey`)

The widget uses the following translation keys. Provide translations in your i18n files under the namespace (default: `complaintRequestWidget`).

| Key | Default (EN) | Default (AR) | Context |
|-----|--------|----------|---------|
| `trigger` | `Support` | `الدعم` | Launcher button tooltip/aria-label. |
| `whatsapp` | `Message us` | `تراسلنا` | WhatsApp action button label. |
| `selectElement` | `Select Element` | `اختر عنصر` | Select element mode button label. |
| `writeComplaint` | `Write Complaint` | `اكتب شكوى` | Complaint panel mode button label. |
| `panelTitle` | `Support Request` | `طلب الدعم` | Main panel title/heading. |
| `panelHint` | `Tell us what's on your mind` | `أخبرنا بما يجول في بالك` | Panel subtitle/hint text. |
| `selectedElement` | `Selected Element` | `العنصر المحدد` | Label for the selected element info section. |
| `noElementSelected` | `No element selected` | `لم يتم تحديد عنصر` | Message when user has not selected an element. |
| `messagePlaceholder` | `Describe the issue...` | `صف المشكلة...` | Placeholder text for the complaint message textarea. |
| `submit` | `Send` | `إرسال` | Submit/send button label. |
| `close` | `Close` | `إغلاق` | Close panel button aria-label. |
| `selecting` | `Click an element to select it` | `انقر على عنصر لتحديده` | Instructional message shown during element selection mode. |
| `sent` | `Thank you for your feedback!` | `شكراً لملاحظاتك!` | Success message shown after submission. |
| `sendError` | `Failed to send. Please try again.` | `فشل الإرسال. حاول مجددا.` | Error message if submission fails. |

---

### Type Definitions

#### `ComplaintPayload` (Request Body)

The JSON object sent to `apiEndpoint` or passed to `requestAdapter`:

```ts
type ComplaintPayload = {
  body: string;                              // Sanitized complaint message (max 4000 chars)
  selectedElement: SelectedElementMetadata | null;  // Element data if user selected one
  page: ComplaintPageMetadata;               // Current page metadata
  createdAt: string;                         // ISO 8601 datetime string
};
```

**Example:**
```json
{
  "body": "The submit button does not work",
  "selectedElement": {
    "selector": "button.btn.btn-primary:nth-of-type(2)",
    "label": "Submit",
    "tagName": "button",
    "className": "btn btn-primary",
    "textPreview": "Submit",
    "rect": { "x": 874, "y": 642, "width": 104, "height": 40 },
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

#### `SelectedElementMetadata`

Metadata about the DOM element selected by the user:

```ts
type SelectedElementMetadata = {
  selector: string;        // CSS selector to uniquely identify the element
  label: string;           // Human-readable label (from aria-label, title, or nearby text)
  tagName: string;         // HTML tag name (uppercase, e.g., "BUTTON", "INPUT")
  className: string;       // Space-separated class names applied to the element
  textPreview: string;     // First 100 characters of element text content
  rect: ElementRect;       // Bounding rectangle of the element
  pageUrl: string;         // Full URL of the page where element was selected
};
```

#### `ElementRect`

Bounding rectangle of a selected element in viewport coordinates:

```ts
type ElementRect = {
  x: number;       // Horizontal distance from viewport left edge (pixels)
  y: number;       // Vertical distance from viewport top edge (pixels)
  width: number;   // Element width (pixels)
  height: number;  // Element height (pixels)
};
```

#### `ComplaintPageMetadata`

Metadata about the current page:

```ts
type ComplaintPageMetadata = {
  title: string;                  // Page title (from `document.title`)
  url: string;                    // Current page URL (from `window.location.href`)
  language: string;               // Language code (from i18n or `document.documentElement.lang`)
  direction: "ltr" | "rtl";       // Text direction (resolved from `direction` prop or document)
};
```

#### `WidgetColorOverrides`

Theme color customization:

```ts
type WidgetColorOverrides = {
  primary?: string;               // Primary action color (buttons, highlights)
  primaryForeground?: string;     // Text/foreground on primary-colored backgrounds
  surface?: string;               // Panel background color
  surfaceForeground?: string;     // Text/foreground on surface backgrounds
  border?: string;                // Border and divider colors
  muted?: string;                 // Muted/disabled element backgrounds
  mutedForeground?: string;       // Text on muted backgrounds
  ring?: string;                  // Focus ring and outline color
};
```

**Default behavior:** If not provided, the widget reads from host CSS variables (e.g., `hsl(var(--primary))`). Falls back to tailwindcss default token names if variables are not defined.

#### `AdapterResult` (Request Adapter Return)

Optional result object returned from `requestAdapter`:

```ts
type AdapterResult = {
  ok?: boolean;              // True if submission succeeded; false/undefined treated as failed
  errorMessage?: string;     // Optional error text shown to user in failure state
};
```

#### `RequestAdapter` (Custom Request Handler)

Async function for custom complaint submission:

```ts
type RequestAdapter = (payload: ComplaintPayload) => Promise<void | AdapterResult>;
```

**Usage:** Implement this to bypass the default `apiEndpoint` POST behavior. Useful for:
- Custom HTTP clients or proxies
- Validation/transformation before sending
- Logging or analytics
- Conditional routing to multiple backends

**Example:**
```tsx
const adapter: RequestAdapter = async (payload) => {
  try {
    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      return {
        ok: false,
        errorMessage: `Server error: ${response.status}`
      };
    }
    
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

<ComplaintRequestWidget requestAdapter={adapter} />
```

#### `WidgetDirection`

Directionality mode for text and layout:

```ts
type WidgetDirection = "ltr" | "rtl" | "auto";
```

- `"ltr"` — Force left-to-right layout and text direction
- `"rtl"` — Force right-to-left layout and text direction (mirrors left/right positioning)
- `"auto"` — Auto-detect from i18n language code, `document.dir` attribute, or default to `"ltr"`

#### `WidgetSide`

Horizontal positioning of the floating launcher bubble:

```ts
type WidgetSide = "left" | "right" | "auto";
```

- `"left"` — Fixed to left edge of viewport
- `"right"` — Fixed to right edge of viewport
- `"auto"` — Chooses left or right based on available viewport space (adaptive)

---

### Styling & CSS Customization

The widget applies the following internal CSS custom properties (variables). Override them via the `colors` prop:

| Variable | Default | Purpose |
|----------|---------|---------|
| `--crw-primary` | `hsl(var(--primary))` | Primary action color for buttons, highlights |
| `--crw-primary-foreground` | `hsl(var(--primary-foreground))` | Text on primary backgrounds |
| `--crw-surface` | `hsl(var(--card))` | Panel background |
| `--crw-surface-foreground` | `hsl(var(--card-foreground))` | Text on surface |
| `--crw-border` | `hsl(var(--border))` | Borders and dividers |
| `--crw-muted` | `hsl(var(--muted))` | Muted UI elements |
| `--crw-muted-foreground` | `hsl(var(--muted-foreground))` | Text on muted elements |
| `--crw-ring` | `hsl(var(--ring))` | Focus rings |

**Example: Override via props**
```tsx
<ComplaintRequestWidget
  colors={{
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    surface: "#f9fafb",
    border: "#e5e7eb"
  }}
/>
```

---

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
