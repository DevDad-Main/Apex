import { Suspense } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import Home from "./components/home";

function AppRoutes() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Home />} />
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
