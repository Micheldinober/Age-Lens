import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Layout() {
  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}
