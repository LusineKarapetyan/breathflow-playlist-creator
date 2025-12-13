import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

interface AccordionContextValue {
  openItems: Set<string>
  toggleItem: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(
  undefined
)

interface AccordionProps {
  type?: "single" | "multiple"
  defaultValue?: string | string[]
  children: React.ReactNode
  className?: string
}

const Accordion = ({
  type = "single",
  defaultValue,
  children,
  className,
}: AccordionProps) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    if (defaultValue) {
      return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue])
    }
    return new Set()
  })

  const toggleItem = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev)
        if (next.has(value)) {
          next.delete(value)
        } else {
          if (type === "single") {
            next.clear()
          }
          next.add(value)
        }
        return next
      })
    },
    [type]
  )

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const AccordionItem = ({ value: _value, children, className }: AccordionItemProps) => {
  return (
    <div className={cn("border-b border-gray-200", className)}>{children}</div>
  )
}

interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionTrigger must be used within Accordion")

  const isOpen = context.openItems.has(value)

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      onClick={() => context.toggleItem(value)}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ className, value, children, ...props }, ref) => {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionContent must be used within Accordion")

  const isOpen = context.openItems.has(value)

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        isOpen ? "animate-accordion-down" : "animate-accordion-up",
        className
      )}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

