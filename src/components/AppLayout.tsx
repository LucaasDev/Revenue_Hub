import { Outlet } from "react-router-dom";
import { AppTopNav } from "./AppTopNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background dark">
      <AppTopNav />
      <main className="min-h-[calc(100vh-64px)] pt-16">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
