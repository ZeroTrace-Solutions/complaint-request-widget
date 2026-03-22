import type { SelectedElementMetadata, WidgetDirection, WidgetSide } from "../types";

export function cn(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(" ");
}

export function safeText(value = ""): string {
  return value.replace(/\s+/g, " ").trim();
}

export function getElementSelector(element: Element | null): string {
  if (!element || element.nodeType !== 1) {
    return "";
  }
  if (element.id) {
    return `#${element.id}`;
  }

  const tag = element.tagName.toLowerCase();
  const className = safeText((element as HTMLElement).className || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .join(".");

  if (className) {
    return `${tag}.${className}`;
  }
  return tag;
}

export function getElementLabel(element: Element | null): string {
  if (!element || element.nodeType !== 1) {
    return "";
  }

  const attrs = ["data-complaint-name", "aria-label", "name", "placeholder", "title"];
  for (const attr of attrs) {
    const value = (element as HTMLElement).getAttribute(attr);
    if (value) {
      return value;
    }
  }

  const text = safeText((element as HTMLElement).textContent || "").slice(0, 120);
  if (text) {
    return text;
  }

  return element.tagName.toLowerCase();
}

export function buildElementReference(element: Element | null): SelectedElementMetadata | null {
  if (!element || element.nodeType !== 1) {
    return null;
  }

  const htmlElement = element as HTMLElement;
  const rect = htmlElement.getBoundingClientRect();

  return {
    selector: getElementSelector(htmlElement),
    label: getElementLabel(htmlElement),
    tagName: htmlElement.tagName.toLowerCase(),
    className: safeText(htmlElement.className || ""),
    textPreview: safeText(htmlElement.textContent || "").slice(0, 180),
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    },
    pageUrl: typeof window !== "undefined" ? window.location.href : ""
  };
}

export function getSide(position: WidgetSide, direction: WidgetDirection | "ltr" | "rtl"): "left" | "right" {
  if (position === "left" || position === "right") {
    return position;
  }
  return direction === "rtl" ? "left" : "right";
}

export function getRectBox(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    label: getElementLabel(element)
  };
}
