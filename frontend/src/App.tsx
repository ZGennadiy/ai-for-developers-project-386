import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventTypesPage } from "@/pages/EventTypesPage";
import { EventTypeDetailPage } from "@/pages/EventTypeDetailPage";
import { BookingConfirmationPage } from "@/pages/BookingConfirmationPage";
import { OwnerBookingsPage } from "@/pages/OwnerBookingsPage";
import { OwnerEventTypesPage } from "@/pages/OwnerEventTypesPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<EventTypesPage />} />
            <Route path="/event-types/:eventTypeId" element={<EventTypeDetailPage />} />
            <Route path="/bookings/:bookingId" element={<BookingConfirmationPage />} />
            <Route path="/owner" element={<OwnerBookingsPage />} />
            <Route path="/owner/event-types" element={<OwnerEventTypesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
