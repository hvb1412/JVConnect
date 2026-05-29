import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { LanguageProvider } from "./lib/i18n";

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
      <Toaster richColors />
    </LanguageProvider>
  );
}