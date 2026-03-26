import { NavLink, useNavigate } from "react-router-dom"
import { useAuthStore } from "../../stores/auth"
import {
  LayoutDashboard,
  Users,
  Target,
  TicketCheck,
  Wallet,
  Wrench,
  FolderOpen,
  Terminal,
  Settings,
  Network,
  LogOut,
  ClipboardList,
  CheckCircle,
  Key,
Send, } from "lucide-react"

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/org-chart", label: "Org Chart", icon: Network },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/tickets", label: "Tickets", icon: TicketCheck },
  { path: "/agents", label: "Agents", icon: Users },
  { path: "/budget", label: "Budget", icon: Wallet },
  { path: "/skills", label: "Skills", icon: Wrench },
  { path: "/files", label: "Files", icon: FolderOpen },
  { path: "/approvals", label: "Approvals", icon: CheckCircle },
  { path: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { path: "/llm-providers", label: "LLM Providers", icon: Key },
  { path: "/channels", label: "Channels", icon: Send },
  { path: "/terminal", label: "Terminal", icon: Terminal },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">AI Orchestrator</h1>
        <p className="text-xs text-gray-500 mt-1">
          {user?.email || "Company Management"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
