import type { ElementRect, SelectedElementMetadata } from "./types";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getElementLabel(element: Element): string {
  const htmlElement = element as HTMLElement;
  const ariaLabel = htmlElement.getAttribute("aria-label");
  if (ariaLabel) {
    return ariaLabel;
  }

  const dataLabel = htmlElement.getAttribute("data-label");
  if (dataLabel) {
    return dataLabel;
  }

  const text = normalizeText(htmlElement.innerText ?? htmlElement.textContent ?? "");
  if (text) {
    return text.slice(0, 140);
  }

  return element.tagName.toLowerCase();
}

function getNodeSelector(node: Element): string {
  if (node.id) {
    return `#${CSS.escape(node.id)}`;
  }

  const testId = node.getAttribute("data-testid");
  if (testId) {
    return `[data-testid=\"${CSS.escape(testId)}\"]`;
  }

  const parts: string[] = [];
  let current: Element | null = node;

  while (current && current.tagName.toLowerCase() !== "html") {
    const tag = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;

    if (!parent) {
      parts.unshift(tag);
      break;
    }

    const siblings = Array.from(parent.children).filter(
      (child: Element) => child.tagName.toLowerCase() === tag
    );
    const index = siblings.indexOf(current) + 1;

    parts.unshift(`${tag}:nth-of-type(${index})`);
    current = parent;
  }

  return parts.join(" > ");
}

export function toRect(rect: DOMRect): ElementRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

export function buildSelectedElementMetadata(
  element: Element
): SelectedElementMetadata {
  const rect = toRect(element.getBoundingClientRect());
  const htmlElement = element as HTMLElement;

  return {
    selector: getNodeSelector(element),
    label: getElementLabel(element),
    tagName: element.tagName.toLowerCase(),
    className: normalizeText(htmlElement.className || ""),
    textPreview: normalizeText(htmlElement.textContent || "").slice(0, 180),
    rect,
    pageUrl: window.location.href
  };
}
