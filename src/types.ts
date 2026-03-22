import type { CSSProperties, ReactNode } from "react";
import type { i18n as I18n } from "i18next";

export type WidgetDirection = "ltr" | "rtl" | "auto";
export type WidgetSide = "left" | "right" | "auto";

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedElementMetadata {
  selector: string;
  label: string;
  tagName: string;
  className: string;
  textPreview: string;
  rect: ElementRect;
  pageUrl: string;
}

export interface ComplaintPageMetadata {
  title: string;
  url: string;
  language: string;
  direction: "ltr" | "rtl";
}

export interface ComplaintPayload {
  body: string;
  selectedElement: SelectedElementMetadata | null;
  page: ComplaintPageMetadata;
  createdAt: string;
}

export interface AdapterResult {
  ok?: boolean;
  errorMessage?: string;
}

export type RequestAdapter = (payload: ComplaintPayload) => Promise<void | AdapterResult>;

export type TranslationKey =
  | "trigger"
  | "whatsapp"
  | "selectElement"
  | "writeComplaint"
  | "panelTitle"
  | "panelHint"
  | "selectedElement"
  | "noElementSelected"
  | "messagePlaceholder"
  | "submit"
  | "close"
  | "selecting"
  | "sent"
  | "sendError";

export interface WidgetTranslations {
  [key: string]: string;
}

export interface WidgetColorOverrides {
  primary?: string;
  primaryForeground?: string;
  surface?: string;
  surfaceForeground?: string;
  border?: string;
  muted?: string;
  mutedForeground?: string;
  ring?: string;
}

export interface ComplaintRequestWidgetProps {
  apiEndpoint?: string;
  whatsappLink?: string;
  whatsappUrl?: string;
  position?: WidgetSide;
  direction?: WidgetDirection;
  labels?: Partial<Record<TranslationKey, string>>;
  colorScheme?: WidgetColorOverrides;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  selectionRootSelector?: string;
  requestAdapter?: RequestAdapter;
  onNavigateToSelected?: (selectedElement: SelectedElementMetadata) => Promise<void> | void;
  translationNamespace?: string;
  locale?: string;
  side?: WidgetSide;
  namespace?: string;
  messages?: Partial<Record<TranslationKey, string>>;
  t?: (namespace: string, key: TranslationKey, defaultValue: string) => string;
  i18n?: I18n;
  colors?: WidgetColorOverrides;
  zIndex?: number;
  style?: CSSProperties;
  panelWidth?: CSSProperties["width"];
  panelHeight?: CSSProperties["height"];
  triggerIcon?: ReactNode;
}
