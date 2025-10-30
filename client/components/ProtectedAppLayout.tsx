import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function ProtectedAppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}


