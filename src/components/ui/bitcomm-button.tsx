import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const bitcommButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-hero text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform border-2 border-bitcoin-orange/30 animate-pulse-glow",
        pow: "bg-bitcoin-orange text-white font-medium hover:bg-bitcoin-dark hover:shadow-lg border-2 border-bitcoin-orange/50 transition-all duration-500",
        mining: "bg-gradient-primary text-white font-bold animate-glow border-2 border-primary-glow shadow-lg"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-12 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BitCommButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bitcommButtonVariants> {
  asChild?: boolean
}

const BitCommButton = React.forwardRef<HTMLButtonElement, BitCommButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(bitcommButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
BitCommButton.displayName = "BitCommButton"

export { BitCommButton, bitcommButtonVariants }