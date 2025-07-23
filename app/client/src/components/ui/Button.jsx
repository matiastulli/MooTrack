import React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-primary text-card shadow hover:bg-primary/90": variant === "default",
          "bg-destructive text-card shadow-sm hover:bg-destructive/90": variant === "destructive",
          "border-2 border-border/20 bg-card/50 shadow-sm hover:bg-accent/20 hover:text-foreground":
            variant === "outline",
          "bg-secondary text-card shadow-sm hover:bg-secondary/80": variant === "secondary",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "text-primary underline-offset-4 hover:underline": variant === "link",
        },
        {
          "h-10 px-4 py-2 text-sm": size === "default" || size === "sm",
          "h-11 px-8 text-base": size === "lg",
          "h-10 w-10": size === "icon",
        },
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }

