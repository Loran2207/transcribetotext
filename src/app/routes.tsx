import { createBrowserRouter } from "react-router";
import { MainApp } from "./components/main-app";
import { DesignSystemPage } from "./components/design-system-page";

export const router = createBrowserRouter([
  { path: "/", Component: MainApp },
  { path: "/design-system", Component: DesignSystemPage },
]);
