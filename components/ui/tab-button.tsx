import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TabButtonProps {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    className?: string
}

export function TabButton({ active, onClick, icon, label, className }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-1.5 rounded-2xl text-sm font-medium",
                "transition-colors duration-200",
                className
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
} 