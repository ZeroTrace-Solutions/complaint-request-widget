import { defaultArMessages, defaultEnMessages, WIDGET_NAMESPACE } from "./locales";
import type { TranslationKey, WidgetDirection, WidgetTranslations } from "./types";

const RTL_LANG_CODES = ["ar", "he", "fa", "ur"];

export function detectDirection(direction: WidgetDirection, locale?: string): "ltr" | "rtl" {
  if (direction === "ltr" || direction === "rtl") {
    return direction;
  }

  if (typeof document !== "undefined") {
    const docDir = document.documentElement.getAttribute("dir");
    if (docDir === "ltr" || docDir === "rtl") {
      return docDir;
    }
  }

  const language = (locale ?? (typeof document !== "undefined" ? document.documentElement.lang : "en"))
    .toLowerCase()
    .split("-")[0] ?? "en";

  return RTL_LANG_CODES.includes(language) ? "rtl" : "ltr";
}

export function getDefaultMessages(locale?: string): WidgetTranslations {
  const isArabic = (locale ?? "en").toLowerCase().startsWith("ar");
  return isArabic ? defaultArMessages : defaultEnMessages;
}

export function createTranslator(
  locale: string | undefined,
  messages: WidgetTranslations,
  customT?: (namespace: string, key: TranslationKey, defaultValue: string) => string,
  namespace = WIDGET_NAMESPACE
) {
  const defaults = getDefaultMessages(locale);

  return (key: TranslationKey): string => {
    const fallback = messages[key] ?? defaults[key] ?? key;
    if (!customT) {
      return fallback;
    }

    return customT(namespace, key, fallback);
  };
}
