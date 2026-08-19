import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Layout } from "./components/Layout";
import { PredictionProvider } from "./context/PredictionProvider";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import PredictPage from "./pages/PredictPage";

export default function App() {
  return (
    <PredictionProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="predict" element={<PredictPage />} />
          {/* The How It Works content moved onto the dashboard; keep old
              links and bookmarks working. */}
          <Route path="how-it-works" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </PredictionProvider>
  );
}
