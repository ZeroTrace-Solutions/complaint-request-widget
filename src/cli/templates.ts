export type ComponentExtension = "tsx" | "jsx";

export function componentTemplate(packageName: string, componentExtension: ComponentExtension = "tsx") {
  if (componentExtension === "jsx") {
    return `"use client";

import { ComplaintRequestWidget } from "${packageName}";

export function ComplaintWidget(props) {
  return <ComplaintRequestWidget {...props} />;
}
`;
  }

  return `"use client";

import {
  ComplaintRequestWidget,
  type ComplaintRequestWidgetProps
} from "${packageName}";

export function ComplaintWidget(props: ComplaintRequestWidgetProps) {
  return <ComplaintRequestWidget {...props} />;
}
`;
}
