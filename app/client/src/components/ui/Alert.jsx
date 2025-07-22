import React from "react"
import { cn } from "../../lib/utils"

const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground/90 [&>svg~*]:pl-8",
      {
        "bg-card/50 text-foreground/90 border-border/20": variant === "default",
        "border-destructive/30 text-destructive bg-destructive/10 [&>svg]:text-destructive":
          variant === "destructive",
      },
      className,
    )}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-base [&_p]:leading-relaxed font-medium", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }

