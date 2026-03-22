export function componentTemplate(packageName: string) {
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
