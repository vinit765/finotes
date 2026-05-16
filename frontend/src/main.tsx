import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { router } from "./app/router";
import { queryClient } from "./app/queryClient";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: "#101827",
            color: "#f5f7fa",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
