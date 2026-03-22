import type { TranslationKey } from "../types";

export const DEFAULT_LABELS: Record<TranslationKey, string> = {
  trigger: "Report an issue",
  whatsapp: "WhatsApp support",
  selectElement: "Pick component",
  writeComplaint: "Write complaint",
  panelTitle: "Send complaint",
  panelHint: "Describe the issue clearly. You can pick an element first.",
  selectedElement: "Selected component",
  noElementSelected: "No component selected yet.",
  messagePlaceholder: "Write your complaint details...",
  submit: "Send",
  close: "Close",
  selecting: "Click any UI element to reference it in your complaint.",
  sent: "Complaint sent successfully.",
  sendError: "Could not send complaint. Please try again."
};
