import type { TranslationKey } from "./types";

export const LEGACY_WIDGET_NAMESPACE = "complaintRequrestWidget";
export const WIDGET_NAMESPACE = "complaintRequestWidget";

export const defaultEnMessages: Record<TranslationKey, string> = {
  trigger: "Report an issue",
  whatsapp: "WhatsApp support",
  selectElement: "Pick component",
  writeComplaint: "Write complaint",
  panelTitle: "Send complaint",
  panelHint: "Describe the issue clearly. You can pick an element first.",
  selectedElement: "Selected element",
  noElementSelected: "No component selected yet.",
  messagePlaceholder: "Write your complaint details...",
  submit: "Submit",
  close: "Close",
  selecting: "Click any UI element to reference it in your complaint.",
  sent: "Complaint sent successfully.",
  sendError: "Could not send complaint. Please try again."
};

export const defaultArMessages: Record<TranslationKey, string> = {
  trigger: "ابلاغ عن مشكلة",
  whatsapp: "دعم واتساب",
  selectElement: "اختر مكونا",
  writeComplaint: "اكتب شكوى",
  panelTitle: "ارسال شكوى",
  panelHint: "صف المشكلة بوضوح. يمكنك اختيار عنصر اولا.",
  selectedElement: "المكون المحدد",
  noElementSelected: "لا يوجد مكون محدد بعد.",
  messagePlaceholder: "اكتب تفاصيل الشكوى...",
  submit: "ارسال",
  close: "اغلاق",
  selecting: "اضغط على اي عنصر واجهة لاختياره في الشكوى.",
  sent: "تم ارسال الشكوى بنجاح.",
  sendError: "تعذر ارسال الشكوى. حاول مرة اخرى."
};
