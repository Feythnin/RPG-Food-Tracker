import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupWizard from './pages/SetupWizard';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import WaterLog from './pages/WaterLog';
import Shop from './pages/Shop';
import Inventory from './pages/Inventory';
import NutritionDashboard from './pages/NutritionDashboard';
import DungeonMap from './pages/DungeonMap';
import Profile from './pages/Profile';
import AppLayout from './components/layout/AppLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/setup" element={
        <ProtectedRoute><SetupWizard /></ProtectedRoute>
      } />
      <Route element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/food" element={<FoodLog />} />
        <Route path="/water" element={<WaterLog />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/nutrition" element={<NutritionDashboard />} />
        <Route path="/dungeon" element={<DungeonMap />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
