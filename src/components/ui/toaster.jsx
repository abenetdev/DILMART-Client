import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

// ── Per-variant icon ──────────────────────────────────────────────────────
function ToastIcon({ variant }) {
  if (variant === "destructive") {
    return <XCircle className="h-4 w-4 shrink-0 text-red-500" />
  }
  // Default — success/info feel: use DilMart teal check
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
}

// ── Toaster ───────────────────────────────────────────────────────────────
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          {/* Icon */}
          <ToastIcon variant={variant} />

          {/* Text block */}
          <div className="flex-1 min-w-0">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>

          {/* Optional action */}
          {action}

          {/* Close */}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
