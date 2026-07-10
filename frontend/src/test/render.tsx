import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

interface RenderOptions {
  route?: string;
  path?: string;
}

export function renderWithProviders(ui: ReactElement, { route = "/", path }: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const content = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {content}
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
