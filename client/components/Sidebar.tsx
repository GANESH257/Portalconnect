import { NavLink } from "react-router-dom";
import { LayoutGrid, Search, Bookmark, Users, FileText } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutGrid className="w-4 h-4" /> },
  { to: "/agents/prospect-finder", label: "Prospect Finder", icon: <Search className="w-4 h-4" /> },
  { to: "/watchlist", label: "Watchlist", icon: <Bookmark className="w-4 h-4" /> },
  { to: "/prospect-management", label: "Prospect Management", icon: <Users className="w-4 h-4" /> },
  { to: "/proposals", label: "Proposals", icon: <FileText className="w-4 h-4" /> },
  { to: "/offerings", label: "Service Offerings", icon: <FileText className="w-4 h-4" /> },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 h-screen border-r bg-sidebar text-sidebar-foreground">
      <div className="h-14 flex items-center px-4 border-b text-sm font-semibold">
        ClinicProspect
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}


