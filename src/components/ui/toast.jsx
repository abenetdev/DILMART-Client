import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

// ── Viewport — bottom-right on desktop, bottom-center on mobile ───────────
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Stack from bottom, max 3 visible, sit above mobile nav (pb-20 on small screens)
      "fixed bottom-0 z-[100] flex flex-col gap-2 p-4 pb-20 w-full sm:pb-4 sm:max-w-sm sm:right-4 sm:bottom-4 sm:left-auto",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

// ── Toast root — compact pill-style card ─────────────────────────────────
const toastVariants = cva(
  // Base: compact, rounded-xl, subtle shadow, smooth enter/exit
  [
    "group pointer-events-auto relative flex w-full items-center gap-2.5",
    "overflow-hidden rounded-xl border px-3.5 py-2.5 shadow-md",
    "text-sm transition-all",
    // Swipe to dismiss
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    // Enter: slide up from bottom + fade in
    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4",
    // Exit: fade out + slide down
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4",
    "data-[state=closed]:duration-200 data-[state=open]:duration-250",
  ],
  {
    variants: {
      variant: {
        // Default: clean white card with DilMart teal left accent
        default: [
          "bg-white border-border text-foreground",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary before:rounded-l-xl",
        ],
        // Destructive: soft red
        destructive: [
          "bg-red-50 border-red-200 text-red-900",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-red-500 before:rounded-l-xl",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
))
Toast.displayName = ToastPrimitives.Root.displayName

// ── Action button ─────────────────────────────────────────────────────────
const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "ml-auto shrink-0 inline-flex h-7 items-center justify-center rounded-md border bg-transparent px-2.5",
      "text-xs font-medium transition-colors",
      "hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      "group-[.destructive]:border-red-200 group-[.destructive]:hover:bg-red-100",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

// ── Close button — subtle, appears on hover ───────────────────────────────
const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "ml-auto shrink-0 rounded-md p-0.5",
      "text-foreground/30 opacity-0 transition-opacity",
      "hover:text-foreground/70 focus:opacity-100 focus:outline-none",
      "group-hover:opacity-100",
      "group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

// ── Title — single line, slightly bold ───────────────────────────────────
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-medium leading-snug", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

// ── Description — optional secondary line ────────────────────────────────
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-xs opacity-75 leading-snug mt-0.5", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
