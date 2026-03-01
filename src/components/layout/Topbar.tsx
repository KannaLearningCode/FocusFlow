"use client";

import { LayoutDashboard, Mic, BookOpen, Layers, Podcast, Book, Sparkles, PenTool, Headphones, Settings2, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type View = "dashboard" | "shadowing" | "upgrader" | "vocabulary" | "phonetic" | "reading" | "writing" | "dictation" | "settings";

interface TopbarProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

export function Topbar({ activeView, setActiveView }: TopbarProps) {
    const { data: session } = useSession();

    const navItems = [
        { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { id: "reading", icon: Book, label: "Reading" },
        { id: "writing", icon: PenTool, label: "Writing" },
        { id: "shadowing", icon: Mic, label: "Shadowing" },
        { id: "upgrader", icon: BookOpen, label: "Upgrader" },
        { id: "vocabulary", icon: Layers, label: "Vocab Lab" },
        { id: "phonetic", icon: Podcast, label: "Phonetics" },
        { id: "dictation", icon: Headphones, label: "Dictation" },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container h-full mx-auto px-4 flex items-center justify-between gap-4">
                {/* Logo Section */}
                <div
                    className="flex items-center gap-2 text-primary cursor-pointer shrink-0"
                    onClick={() => setActiveView("dashboard")}
                >
                    <Sparkles className="w-6 h-6" />
                    <span className="font-bold text-xl tracking-tight hidden sm:inline-block">FocusFlow</span>
                </div>

                {/* Navigation - Tablet/Desktop */}
                <nav className="flex-1 hidden md:flex items-center justify-center gap-1 overflow-x-auto no-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id as View)}
                                className={cn(
                                    "px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 shrink-0",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground/70")} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Right Section: Mobile Menu (simplified) & User Profile */}
                <div className="flex items-center gap-2">
                    {/* Compact View Selector for Mobile Viewport */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 h-9">
                                    <span className="font-bold text-xs uppercase tracking-wider text-primary">
                                        {navItems.find(n => n.id === activeView)?.label || "Menu"}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {navItems.map(item => (
                                    <DropdownMenuItem key={item.id} onClick={() => setActiveView(item.id as View)}>
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {item.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-secondary/80 transition-colors">
                                <Avatar className="w-8 h-8 border border-border/50">
                                    {session?.user?.image && <AvatarImage src={session.user.image} />}
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                        {session?.user?.name?.[0] || <UserIcon className="w-4 h-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setActiveView("settings")}>
                                <Settings2 className="w-4 h-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
