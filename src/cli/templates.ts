import { defaultArMessages, defaultEnMessages } from "../locales";

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

export const localeTemplateEn = {
  ...defaultEnMessages
};

export const localeTemplateAr = {
  ...defaultArMessages
};
