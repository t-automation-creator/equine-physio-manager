import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-cvs-blue text-white shadow-sm hover:bg-cvs-blue-dark",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300",
        secondary:
          "bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200",
        ghost: 
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        link: 
          "text-cvs-blue underline-offset-4 hover:underline",
        primary:
          "bg-cvs-red text-white shadow-sm hover:bg-cvs-red-dark",
        success:
          "bg-cvs-green text-white shadow-sm hover:bg-cvs-green/90",
      },
      size: {
        default: "h-11 px-6 py-2 rounded-full",
        sm: "h-9 px-4 text-xs rounded-full",
        lg: "h-12 px-8 text-base rounded-full",
        xl: "h-14 px-10 text-base rounded-full",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
        "icon-lg": "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
