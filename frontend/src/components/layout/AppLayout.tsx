import { NavLink, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">Календарь бронирования</span>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "font-medium text-primary" : "text-muted-foreground"
              }
            >
              Каталог
            </NavLink>
            <NavLink
              to="/owner"
              className={({ isActive }) =>
                isActive ? "font-medium text-primary" : "text-muted-foreground"
              }
            >
              Кабинет владельца
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
