import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TabButtonProps {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
}

export function TabButton({ active, onClick, icon, label }: TabButtonProps) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn(
                "gap-2",
                active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
            )}
            onClick={onClick}
        >
            {icon}
            {label}
        </Button>
    )
} 