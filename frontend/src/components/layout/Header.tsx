import { Bell, User } from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          Welcome back
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-accent rounded-lg relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">admin@company.com</p>
          </div>
        </div>
      </div>
    </header>
  )
}
