import { MoreVertical, Pencil, Trash } from "lucide-react"
import { Space } from "@/types/space"  // We'll create this type file later
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface SpaceActionsDropdownProps {
    space: Space
    onRename: (spaceId: string) => void
    onDelete: (spaceId: string) => void
}

export function SpaceActionsDropdown({
    space,
    onRename,
    onDelete,
}: SpaceActionsDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRename(space.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onDelete(space.id)}
                    className="text-red-600 dark:text-red-400"
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 