import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Accounts from "./pages/Accounts";
import Cards from "./pages/Cards";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import Subscriptions from "./pages/Subscriptions";
import SettingsPage from "./pages/Settings";
import SettingsAccounts from "./pages/SettingsAccounts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/accounts" element={<SettingsAccounts />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
