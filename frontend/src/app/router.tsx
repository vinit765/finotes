import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthPage } from "../features/auth/AuthPage";
import { DashboardPage } from "../features/notes/DashboardPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { getToken } from "../lib/auth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: getToken() ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <AuthPage mode="login" />,
  },
  {
    path: "/register",
    element: <AuthPage mode="register" />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
]);
