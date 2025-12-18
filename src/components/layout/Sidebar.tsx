import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const { signOut, profile } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  const isExpanded = !collapsed || isHovering;

  const navigation = [
    { name: t("nav.dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("nav.assets"), href: "/assets", icon: Package },
  ];

  const bottomNavigation = [
    { name: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo */}
      <div className="flex flex-col h-auto border-b border-sidebar-border">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/30 flex-shrink-0">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className={cn(
              "font-semibold text-foreground whitespace-nowrap transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
            )}>
              myEasyAssets
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent hover:scale-110 transition-all duration-300 flex-shrink-0",
              isExpanded ? "opacity-100" : "opacity-0 w-0 p-0"
            )}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
        {/* Company Name */}
        {isExpanded && profile?.company_name && (
          <div className="px-4 pb-3 overflow-hidden">
            <p className={cn(
              "text-xs text-muted-foreground truncate transition-all duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}>
              {profile.company_name}
            </p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent hover:shadow-sm hover:translate-x-1"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
            <span className={cn(
              "whitespace-nowrap transition-all duration-200",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
            )}>
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* User Profile */}
        {isExpanded && profile && (
          <div className="px-3 py-2 mb-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer overflow-hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-200 hover:bg-primary/20 hover:scale-110 flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className={cn(
                "flex-1 min-w-0 transition-all duration-200",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
              )}>
                <p className="text-sm font-medium text-foreground truncate">
                  {profile.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent hover:shadow-sm hover:translate-x-1"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
            <span className={cn(
              "whitespace-nowrap transition-all duration-200",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
            )}>
              {item.name}
            </span>
          </NavLink>
        ))}
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
            "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent hover:shadow-sm hover:translate-x-1"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
          <span className={cn(
            "whitespace-nowrap transition-all duration-200",
            isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
          )}>
            {t("nav.logout")}
          </span>
        </Button>
      </div>
    </aside>
  );
}
