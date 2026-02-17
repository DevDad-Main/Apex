import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import About from "./components/About";
import Privacy from "./components/Privacy";
import Settings from "./components/Settings";
import DarkModeInitializer from "./components/DarkModeInitializer";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <DarkModeInitializer />
      <AppRoutes />
    </Suspense>
  );
}

export default App;
