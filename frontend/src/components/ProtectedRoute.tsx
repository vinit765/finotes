import { Navigate } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { getToken } from "../lib/auth";

export function ProtectedRoute({ children }: PropsWithChildren) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
