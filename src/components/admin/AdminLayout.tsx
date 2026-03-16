import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Building2, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/tenants", label: "Tenants", icon: Building2 },
  { to: "/admin/users", label: "Usuários", icon: Users },
];

export function AdminLayout() {
  const { isGlobalAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isGlobalAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <NavLink to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </NavLink>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento global da plataforma</p>
        </div>
      </div>

      <nav className="flex gap-1 border-b border-border/50 pb-px">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
