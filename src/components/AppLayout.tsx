import { Outlet } from "react-router-dom";
import { AppTopNav } from "./AppTopNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background dark">
      <AppTopNav />
      <main className="min-h-[calc(100vh-64px)] pt-16">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
