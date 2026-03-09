import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Target,
  BarChart3,
  Tags,
  User,
  LogOut,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Fluxo de Caixa", icon: ArrowLeftRight },
  { to: "/accounts", label: "Contas", icon: Landmark },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/categories", label: "Categorias", icon: Tags },
  { to: "/reports", label: "Relatórios", icon: BarChart3 },
];

export function AppTopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/90 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">
            Avenue
          </span>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <User className="h-4 w-4" />
              <span className="hidden lg:block max-w-[150px] truncate">{user?.user_metadata?.display_name || user?.email}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="h-4 w-4 mr-2" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={async () => { await signOut(); navigate("/login"); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border/50 px-4 pb-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
