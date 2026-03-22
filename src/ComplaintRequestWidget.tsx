import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Bug, Send, X, Hand, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { defaultArMessages, defaultEnMessages, WIDGET_NAMESPACE } from "./locales";
import {
  buildElementReference,
  cn,
  getElementLabel,
  getRectBox,
  getSide
} from "./widget/helpers";
import type {
  ComplaintRequestWidgetProps,
  RequestAdapter,
  SelectedElementMetadata,
  TranslationKey,
  WidgetColorOverrides
} from "./types";

interface StatusState {
  type: "idle" | "success" | "error" | "info";
  text: string;
}

interface RectBox {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
}

const MAX_MESSAGE_LENGTH = 4000;

function sanitizeMessage(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function isSafeApiEndpoint(value?: string): boolean {
  if (!value) {
    return false;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function resolveDirection(direction: ComplaintRequestWidgetProps["direction"], i18nDir?: string): "ltr" | "rtl" {
  if (direction === "ltr" || direction === "rtl") {
    return direction;
  }

  if (i18nDir === "ltr" || i18nDir === "rtl") {
    return i18nDir;
  }

  if (typeof document !== "undefined") {
    const docDir = document.dir;
    if (docDir === "ltr" || docDir === "rtl") {
      return docDir;
    }
  }

  return "ltr";
}

function mapPalette(colorScheme?: WidgetColorOverrides, colors?: WidgetColorOverrides) {
  const merged = {
    ...colorScheme,
    ...colors
  };

  return {
    "--crw-primary": merged.primary || "hsl(var(--primary))",
    "--crw-primary-foreground": merged.primaryForeground || "hsl(var(--primary-foreground))",
    "--crw-surface": merged.surface || "hsl(var(--card))",
    "--crw-surface-foreground": merged.surfaceForeground || "hsl(var(--card-foreground))",
    "--crw-border": merged.border || "hsl(var(--border))",
    "--crw-muted": merged.muted || "hsl(var(--muted))",
    "--crw-muted-foreground": merged.mutedForeground || "hsl(var(--muted-foreground))",
    "--crw-ring": merged.ring || "hsl(var(--ring))"
  } as React.CSSProperties;
}

function isArabicLanguage(language?: string): boolean {
  return Boolean(language && /^ar(?:-|$)/i.test(language));
}

function Button({
  asChild,
  size,
  variant,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  size?: "sm" | "icon" | "icon-lg" | "icon-sm";
  variant?: "default" | "outline" | "ghost";
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md border border-transparent text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
    size === "icon" && "h-10 w-10",
    size === "icon-sm" && "h-8 w-8",
    size === "icon-lg" && "h-12 w-12",
    size === "sm" && "h-9 px-3",
    variant === "outline" && "border",
    variant === "ghost" && "border-transparent",
    !variant && "h-10 px-4 py-2",
    className
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    const childClassName = typeof child.props.className === "string" ? child.props.className : "";
    return React.cloneElement(child, {
      ...props,
      className: cn(classes, childClassName)
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

function resolveSelectedNode(
  selectedElementNode: HTMLElement | null,
  selectedElement: SelectedElementMetadata | null
): Element | null {
  if (selectedElementNode && document.contains(selectedElementNode)) {
    return selectedElementNode;
  }

  const selector = selectedElement?.selector;
  if (!selector) {
    return null;
  }

  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function getAdapterError(result: Awaited<ReturnType<RequestAdapter>>): string | null {
  if (result && typeof result === "object" && "ok" in result && result.ok === false) {
    return result.errorMessage || null;
  }
  return null;
}

export default function ComplaintRequestWidget({
  apiEndpoint,
  whatsappLink,
  whatsappUrl,
  position = "auto",
  direction,
  labels,
  colorScheme,
  className,
  buttonClassName,
  panelClassName,
  selectionRootSelector,
  requestAdapter,
  onNavigateToSelected,
  translationNamespace = WIDGET_NAMESPACE,
  locale,
  side: _side,
  namespace,
  messages,
  t,
  i18n: externalI18n,
  colors,
  zIndex,
  style,
  panelWidth,
  panelHeight,
  triggerIcon: _triggerIcon
}: ComplaintRequestWidgetProps) {
  void _side;
  void _triggerIcon;

  const { i18n: hookI18n } = useTranslation(translationNamespace, { useSuspense: false });
  const activeI18n = externalI18n ?? hookI18n;
  const [, setLanguageTick] = useState(0);

  useEffect(() => {
    if (!externalI18n) {
      return;
    }

    const handleLanguageChanged = () => {
      setLanguageTick((value) => value + 1);
    };

    externalI18n.on("languageChanged", handleLanguageChanged);
    return () => {
      externalI18n.off("languageChanged", handleLanguageChanged);
    };
  }, [externalI18n]);

  const activeLanguage =
    locale ||
    activeI18n?.resolvedLanguage ||
    activeI18n?.language ||
    (typeof document !== "undefined" ? document.documentElement.lang : "") ||
    "en";

  const baseDefaultLabels = useMemo(
    () => (isArabicLanguage(activeLanguage) ? defaultArMessages : defaultEnMessages),
    [activeLanguage]
  );

  const translateWithI18n = useCallback(
    (key: TranslationKey, fallback: string): string => {
      if (!activeI18n) {
        return fallback;
      }

      const resolved = activeI18n.t(key, {
        ns: translationNamespace,
        defaultValue: fallback
      });

      return typeof resolved === "string" ? resolved : fallback;
    },
    [activeI18n, translationNamespace]
  );

  const translatedLabels = {
    trigger: translateWithI18n("trigger", baseDefaultLabels.trigger),
    whatsapp: translateWithI18n("whatsapp", baseDefaultLabels.whatsapp),
    selectElement: translateWithI18n("selectElement", baseDefaultLabels.selectElement),
    writeComplaint: translateWithI18n("writeComplaint", baseDefaultLabels.writeComplaint),
    panelTitle: translateWithI18n("panelTitle", baseDefaultLabels.panelTitle),
    panelHint: translateWithI18n("panelHint", baseDefaultLabels.panelHint),
    selectedElement: translateWithI18n("selectedElement", baseDefaultLabels.selectedElement),
    noElementSelected: translateWithI18n("noElementSelected", baseDefaultLabels.noElementSelected),
    messagePlaceholder: translateWithI18n("messagePlaceholder", baseDefaultLabels.messagePlaceholder),
    submit: translateWithI18n("submit", baseDefaultLabels.submit),
    close: translateWithI18n("close", baseDefaultLabels.close),
    selecting: translateWithI18n("selecting", baseDefaultLabels.selecting),
    sent: translateWithI18n("sent", baseDefaultLabels.sent),
    sendError: translateWithI18n("sendError", baseDefaultLabels.sendError)
  };

  const mappedMessages = {
    ...translatedLabels,
    ...(messages || {})
  };

  const mergedLabels = {
    ...baseDefaultLabels,
    ...mappedMessages,
    ...(labels || {})
  };

  const translateLabel = (key: TranslationKey): string => {
    const fallback = mergedLabels[key];
    if (!t) {
      return fallback;
    }
    return t(namespace || translationNamespace, key, fallback);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedElement, setSelectedElement] = useState<SelectedElementMetadata | null>(null);
  const [selectedElementNode, setSelectedElementNode] = useState<HTMLElement | null>(null);
  const [hoveredBox, setHoveredBox] = useState<RectBox | null>(null);
  const [selectedPreviewBox, setSelectedPreviewBox] = useState<RectBox | null>(null);
  const [isPreviewingSelected, setIsPreviewingSelected] = useState(false);
  const [status, setStatus] = useState<StatusState>({ type: "idle", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const hoveredElementRef = useRef<HTMLElement | null>(null);
  const prevHtmlCursorRef = useRef("");
  const prevBodyCursorRef = useRef("");

  const resolvedDirection = resolveDirection(direction, activeI18n?.dir?.());
  const resolvedSide = getSide(position, resolvedDirection);
  const cssVars = useMemo(() => mapPalette(colorScheme, colors), [colorScheme, colors]);

  const highlightAndScrollTo = (node: Element | null): boolean => {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    setIsPreviewingSelected(true);
    window.setTimeout(() => setIsPreviewingSelected(false), 1200);
    return true;
  };

  const handleGoToSelected = async () => {
    if (!selectedElement) {
      return;
    }

    const localNode = resolveSelectedNode(selectedElementNode, selectedElement);
    if (highlightAndScrollTo(localNode)) {
      return;
    }

    if (onNavigateToSelected) {
      await onNavigateToSelected(selectedElement);
      window.setTimeout(() => {
        const afterNavigateNode = resolveSelectedNode(selectedElementNode, selectedElement);
        highlightAndScrollTo(afterNavigateNode);
      }, 260);
      return;
    }

    if (selectedElement.pageUrl && window.location.href !== selectedElement.pageUrl) {
      window.location.assign(selectedElement.pageUrl);
    }
  };

  useEffect(() => {
    if (!isSelecting) {
      hoveredElementRef.current = null;
      setHoveredBox(null);
      return;
    }

    const rootSelection = selectionRootSelector
      ? document.querySelector(selectionRootSelector)
      : document.body;

    prevHtmlCursorRef.current = document.documentElement.style.cursor;
    prevBodyCursorRef.current = document.body.style.cursor;
    document.documentElement.style.cursor = "crosshair";
    document.body.style.cursor = "crosshair";

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (rootSelection && !rootSelection.contains(target)) {
        return;
      }

      hoveredElementRef.current = target;
      const rect = target.getBoundingClientRect();
      setHoveredBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        label: getElementLabel(target)
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (rootSelection && !rootSelection.contains(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const reference = buildElementReference(target);
      setSelectedElement(reference);
      setSelectedElementNode(target);
      setIsSelecting(false);
      setIsPanelOpen(true);
      setIsMenuOpen(false);
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSelecting(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleEsc, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleEsc, true);
      hoveredElementRef.current = null;
      setHoveredBox(null);
      document.documentElement.style.cursor = prevHtmlCursorRef.current;
      document.body.style.cursor = prevBodyCursorRef.current;
    };
  }, [isSelecting, selectionRootSelector]);

  useEffect(() => {
    if (!isPreviewingSelected || isSelecting) {
      setSelectedPreviewBox(null);
      return;
    }

    const updatePreview = () => {
      const node = resolveSelectedNode(selectedElementNode, selectedElement);
      setSelectedPreviewBox(getRectBox(node));
    };

    updatePreview();
    window.addEventListener("scroll", updatePreview, true);
    window.addEventListener("resize", updatePreview);

    return () => {
      window.removeEventListener("scroll", updatePreview, true);
      window.removeEventListener("resize", updatePreview);
    };
  }, [isPreviewingSelected, isSelecting, selectedElement, selectedElementNode]);

  const handleSubmit = async () => {
    const body = sanitizeMessage(message).slice(0, MAX_MESSAGE_LENGTH);

    if (!body) {
      return;
    }
    if (!apiEndpoint && !requestAdapter) {
      setStatus({ type: "error", text: "Missing apiEndpoint or requestAdapter." });
      return;
    }

    if (!requestAdapter && !isSafeApiEndpoint(apiEndpoint)) {
      setStatus({ type: "error", text: "Invalid apiEndpoint. Use a relative path or http/https URL." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", text: "" });

    const payload = {
      body,
      selectedElement,
      page: {
        title: document.title,
        url: window.location.href,
        language: activeLanguage,
        direction: (document.dir || resolvedDirection) as "ltr" | "rtl"
      },
      createdAt: new Date().toISOString()
    };

    try {
      if (requestAdapter) {
        const adapterResult = await requestAdapter(payload);
        const adapterError = getAdapterError(adapterResult);
        if (adapterError) {
          throw new Error(adapterError);
        }
      } else {
        const response = await fetch(apiEndpoint as string, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      setStatus({ type: "success", text: translateLabel("sent") });
      setMessage("");
      setSelectedElement(null);
      setSelectedElementNode(null);
      setIsPreviewingSelected(false);
      setIsPanelOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error ? error.message : translateLabel("sendError")
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={rootRef}
      style={{ ...cssVars, ...style, zIndex }}
      className={cn(
        "fixed bottom-4 z-[80] sm:bottom-6",
        resolvedSide === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6",
        className
      )}
      data-complaint-widget-root="true"
      dir={resolvedDirection}
    >
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className={cn(
              "absolute bottom-16 rounded-2xl border p-4 shadow-xl backdrop-blur-md",
              resolvedSide === "left" ? "left-0" : "right-0",
              panelClassName
            )}
            style={{
              width: panelWidth ?? "min(92vw,24rem)",
              maxWidth: "92vw",
              height: panelHeight,
              backgroundColor: "color-mix(in oklab, var(--crw-surface) 92%, transparent)",
              borderColor: "var(--crw-border)",
              color: "var(--crw-surface-foreground)"
            }}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{translateLabel("panelTitle")}</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--crw-muted-foreground)" }}>
                  {translateLabel("panelHint")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsPanelOpen(false)}
                aria-label={translateLabel("close")}
                className="cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div
              className={cn(
                "mb-3 rounded-xl border p-2 text-xs",
                selectedElement ? "cursor-pointer transition-colors hover:bg-muted/40" : ""
              )}
              style={{
                borderColor: "var(--crw-border)",
                backgroundColor: "color-mix(in oklab, var(--crw-muted) 40%, transparent)"
              }}
              onMouseEnter={() => {
                if (selectedElement) {
                  setIsPreviewingSelected(true);
                }
              }}
              onMouseLeave={() => setIsPreviewingSelected(false)}
              onClick={() => {
                void handleGoToSelected();
              }}
              role={selectedElement ? "button" : undefined}
              tabIndex={selectedElement ? 0 : undefined}
              onKeyDown={(event) => {
                if (!selectedElement) {
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void handleGoToSelected();
                }
              }}
              title={selectedElement ? "Go to selected component" : undefined}
            >
              <p className="mb-1 font-medium">{translateLabel("selectedElement")}</p>
              {selectedElement ? (
                <p className="line-clamp-2" style={{ color: "var(--crw-muted-foreground)" }}>
                  {selectedElement.label} ({selectedElement.selector || selectedElement.tagName})
                </p>
              ) : (
                <p style={{ color: "var(--crw-muted-foreground)" }}>
                  {translateLabel("noElementSelected")}
                </p>
              )}
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder={translateLabel("messagePlaceholder")}
              className="w-full resize-y rounded-xl border p-2 text-sm outline-none"
              style={{
                borderColor: "var(--crw-border)",
                backgroundColor: "color-mix(in oklab, var(--crw-surface) 84%, transparent)"
              }}
            />

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSelecting(true);
                  setIsPanelOpen(false);
                }}
                className="cursor-pointer"
              >
                <Hand className="size-4" />
                {translateLabel("selectElement")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={isSubmitting || !message.trim()}
                className="cursor-pointer"
              >
                <Send className="size-4" />
                {isSubmitting ? "..." : translateLabel("submit")}
              </Button>
            </div>

            {status.text && (
              <p
                className={cn(
                  "mt-2 text-xs",
                  status.type === "error" ? "text-destructive" : "text-emerald-600"
                )}
              >
                {status.text}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          "mb-3 flex flex-col gap-2 transition-all",
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        initial={false}
        animate={isMenuOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
          closed: { opacity: 0, y: 6, transition: { staggerChildren: 0.04, staggerDirection: -1 } }
        }}
      >
        <motion.div variants={{ open: { opacity: 1, x: 0, scale: 1 }, closed: { opacity: 0, x: 6, scale: 0.9 } }}>
          <Button
            asChild
            size="icon"
            className={cn("rounded-full shadow-lg cursor-pointer", buttonClassName)}
            style={{
              backgroundColor: "var(--crw-surface)",
              color: "var(--crw-surface-foreground)",
              border: "1px solid var(--crw-border)"
            }}
            title={translateLabel("whatsapp")}
          >
            <a
              href={whatsappLink || whatsappUrl || "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!whatsappLink && !whatsappUrl}
              onClick={(event) => {
                if (!whatsappLink && !whatsappUrl) {
                  event.preventDefault();
                }
              }}
            >
              <MessageCircle className="size-5" />
            </a>
          </Button>
        </motion.div>

        <motion.div variants={{ open: { opacity: 1, x: 0, scale: 1 }, closed: { opacity: 0, x: 6, scale: 0.9 } }}>
          <Button
            size="icon"
            onClick={() => {
              setIsSelecting(true);
              setIsMenuOpen(false);
              setStatus({ type: "info", text: translateLabel("selecting") });
            }}
            className={cn("rounded-full shadow-lg cursor-pointer", buttonClassName)}
            style={{
              backgroundColor: "var(--crw-surface)",
              color: "var(--crw-surface-foreground)",
              border: "1px solid var(--crw-border)"
            }}
            title={translateLabel("selectElement")}
          >
            <Hand className="size-5" />
          </Button>
        </motion.div>

        <motion.div variants={{ open: { opacity: 1, x: 0, scale: 1 }, closed: { opacity: 0, x: 6, scale: 0.9 } }}>
          <Button
            size="icon"
            onClick={() => {
              setIsPanelOpen((prev) => !prev);
              setIsMenuOpen(false);
            }}
            className={cn("rounded-full shadow-lg cursor-pointer", buttonClassName)}
            style={{
              backgroundColor: "var(--crw-surface)",
              color: "var(--crw-surface-foreground)",
              border: "1px solid var(--crw-border)"
            }}
            title={translateLabel("writeComplaint")}
          >
            <Bug className="size-5" />
          </Button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isSelecting && hoveredBox && (
          <motion.div
            className="pointer-events-none fixed z-[79] rounded-lg border"
            style={{
              top: hoveredBox.top,
              left: hoveredBox.left,
              width: hoveredBox.width,
              height: hoveredBox.height,
              borderColor: "var(--crw-ring)",
              boxShadow:
                "0 0 0 1px color-mix(in oklab, var(--crw-ring) 30%, transparent), 0 0 24px color-mix(in oklab, var(--crw-ring) 35%, transparent)",
              backgroundColor: "color-mix(in oklab, var(--crw-ring) 10%, transparent)"
            }}
            initial={{ opacity: 0.2, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          >
            <div
              className="absolute -top-7 left-0 max-w-[16rem] truncate rounded-md border px-2 py-0.5 text-[11px]"
              style={{
                borderColor: "var(--crw-ring)",
                color: "var(--crw-surface-foreground)",
                backgroundColor: "color-mix(in oklab, var(--crw-surface) 96%, transparent)"
              }}
            >
              {hoveredBox.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPreviewingSelected && !isSelecting && selectedPreviewBox && (
          <motion.div
            className="pointer-events-none fixed z-[79] rounded-lg border"
            style={{
              top: selectedPreviewBox.top,
              left: selectedPreviewBox.left,
              width: selectedPreviewBox.width,
              height: selectedPreviewBox.height,
              borderColor: "var(--crw-ring)",
              boxShadow:
                "0 0 0 1px color-mix(in oklab, var(--crw-ring) 30%, transparent), 0 0 24px color-mix(in oklab, var(--crw-ring) 35%, transparent)",
              backgroundColor: "color-mix(in oklab, var(--crw-ring) 10%, transparent)"
            }}
            initial={{ opacity: 0.2, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          >
            <div
              className="absolute -top-7 left-0 max-w-[16rem] truncate rounded-md border px-2 py-0.5 text-[11px]"
              style={{
                borderColor: "var(--crw-ring)",
                color: "var(--crw-surface-foreground)",
                backgroundColor: "color-mix(in oklab, var(--crw-surface) 96%, transparent)"
              }}
            >
              {selectedPreviewBox.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSelecting && (
          <motion.div
            className={cn(
              "mb-2 max-w-56 rounded-xl border px-3 py-2 text-xs shadow-lg",
              resolvedSide === "left" ? "text-left" : "text-right"
            )}
            style={{
              backgroundColor: "var(--crw-surface)",
              borderColor: "var(--crw-border)",
              color: "var(--crw-surface-foreground)"
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
          >
            {translateLabel("selecting")}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isSelecting && status.type === "success" && status.text && (
          <motion.div
            className="mb-2 flex items-center gap-1 rounded-xl border px-3 py-2 text-xs shadow-lg"
            style={{
              backgroundColor: "var(--crw-surface)",
              borderColor: "var(--crw-border)",
              color: "var(--crw-surface-foreground)"
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
          >
            <Check className="size-3.5 text-emerald-600" />
            {status.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={isMenuOpen ? { rotate: 45, y: [0, -5, 0] } : { rotate: 0, y: [0, -5, 0] }}
        transition={{
          rotate: { duration: 0.2, ease: "easeOut" },
          y: { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <Button
          size="icon-lg"
          onClick={() => {
            setIsMenuOpen((prev) => !prev);
            setStatus({ type: "idle", text: "" });
          }}
          className={cn("rounded-full shadow-xl cursor-pointer", buttonClassName)}
          style={{
            backgroundColor: "var(--crw-primary)",
            color: "var(--crw-primary-foreground)",
            boxShadow: "0 10px 25px color-mix(in oklab, var(--crw-primary) 30%, transparent)"
          }}
          title={translateLabel("trigger")}
        >
          {isMenuOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        </Button>
      </motion.div>
    </div>
  );
}

export { ComplaintRequestWidget };
