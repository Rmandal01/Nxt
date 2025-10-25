"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Home, Code2, BookOpen, Trophy, User, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/playground", label: "Playground", icon: Code2 },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-lg bg-background/80">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Prompt Battle
              </span>
            </Link>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "gap-2 transition-all",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* User section */}
            <div className="hidden md:flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Trophy className="w-3 h-3 text-accent" />
                1,250 pts
              </Badge>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <User className="w-4 h-4" />
                Profile
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-background/95 backdrop-blur-lg pt-16">
            <div className="container mx-auto px-4 py-6">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-12 text-base",
                          isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-muted-foreground">Your Points</span>
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="w-3 h-3 text-accent" />
                    1,250
                  </Badge>
                </div>
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <User className="w-4 h-4" />
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  )
}
