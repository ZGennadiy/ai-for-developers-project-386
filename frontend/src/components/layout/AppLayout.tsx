import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useOwner } from "@/hooks/useOwner";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-medium text-primary" : "text-muted-foreground";

export function AppLayout() {
  const location = useLocation();
  const isOwnerSection = location.pathname.startsWith("/owner");
  const ownerQuery = useOwner();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">Календарь бронирования</span>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={navLinkClass}
            >
              Каталог
            </NavLink>
            <NavLink
              to="/owner"
              className={navLinkClass}
            >
              Кабинет владельца
            </NavLink>
          </nav>
        </div>
        {isOwnerSection ? (
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2">
            <nav className="flex gap-4 text-sm">
              <NavLink
                to="/owner"
                end
                className={({ isActive }) =>
                  isActive ? "font-medium text-primary" : "text-muted-foreground"
                }
              >
                Предстоящие встречи
              </NavLink>
              <NavLink
                to="/owner/event-types"
                className={({ isActive }) =>
                  isActive ? "font-medium text-primary" : "text-muted-foreground"
                }
              >
                Типы событий
              </NavLink>
            </nav>
            {ownerQuery.data ? (
              <span className="text-sm text-muted-foreground">
                {ownerQuery.data.name} ({ownerQuery.data.email})
              </span>
            ) : null}
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
