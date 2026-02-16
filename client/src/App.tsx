import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import About from "./components/About";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AppRoutes />
    </Suspense>
  );
}

export default App;
