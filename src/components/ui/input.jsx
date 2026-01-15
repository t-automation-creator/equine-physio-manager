import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus:outline-none focus:border-cvs-blue focus:ring-1 focus:ring-cvs-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
