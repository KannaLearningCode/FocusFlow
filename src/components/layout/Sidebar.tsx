import { LayoutDashboard, Mic, BookOpen, Layers, Podcast, Book, Sparkles, PenTool, PanelLeftClose, PanelLeftOpen, Headphones, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type View = "dashboard" | "shadowing" | "upgrader" | "vocabulary" | "phonetic" | "reading" | "writing" | "dictation" | "settings";

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

export function Sidebar({ activeView, setActiveView, isCollapsed, toggleSidebar }: SidebarProps) {
    const navItems = [
        { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { id: "reading", icon: Book, label: "Reading Lounge" },
        { id: "writing", icon: PenTool, label: "Writing Gym" },
        { id: "shadowing", icon: Mic, label: "Shadowing Station" },
        { id: "upgrader", icon: BookOpen, label: "Sentence Upgrader" },
        { id: "vocabulary", icon: Layers, label: "Vocabulary Lab" },
        { id: "phonetic", icon: Podcast, label: "Phonetic Studio" },
        { id: "dictation", icon: Headphones, label: "Dictation Lab" },
        { id: "settings", icon: Settings2, label: "Settings" },
    ];

    return (
        <aside
            className={cn(
                "bg-card border-r border-border h-screen fixed left-0 top-0 overflow-y-auto z-50 hidden md:flex flex-col transition-all duration-300",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className={cn("p-6 border-b border-border/50 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-6 h-6" />
                        <span className="font-bold text-xl tracking-tight">FocusFlow</span>
                    </div>
                )}
                {isCollapsed && <Sparkles className="w-6 h-6 text-primary" />}
            </div>

            <nav className="flex-1 p-2 space-y-2 mt-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as View)}
                            className={cn(
                                "w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                                isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground/70")} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                <button
                    onClick={toggleSidebar}
                    className={cn(
                        "w-full flex items-center rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all duration-200",
                        isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                    )}
                >
                    {isCollapsed ? (
                        <PanelLeftOpen className="w-5 h-5" />
                    ) : (
                        <>
                            <PanelLeftClose className="w-5 h-5" />
                            <span>Collapse Sidebar</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
