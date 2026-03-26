import * as React from "react"
import { cn } from "../../lib/utils"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4",
          variant === "default" && "bg-gray-50 text-gray-900 border-gray-200",
          variant === "destructive" && "bg-red-50 text-red-900 border-red-200",
          className
        )}
        {...props}
      />
    )
  }
)
Alert.displayName = "Alert"

export { Alert }
