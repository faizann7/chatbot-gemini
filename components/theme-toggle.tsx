"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
} 