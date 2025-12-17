// src/App.tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainPage from "./MainPage";
import HomePage from "./HomePage";
import { ComponentPage } from "./ComponentPage";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import BidPage from "./BidPage"; // Добавь этот импорт
import ProfilePage from "./ProfilePage"; // Добавляем импорт
import BidListingsPage from "./BidListingsPage"; // <-- Добавь этот импорт
import BidDetailsPage from "./BidDetailsPage"; // ⭐️ Добавляем импорт страницы деталей ⭐️



function App() {
  useEffect(() => {
    invoke('tauri', { cmd: 'create' })
      .then(() => { console.log("Tauri launched") })
      .catch(() => { console.log("Tauri not launched") })
    
    return () => {
      invoke('tauri', { cmd: 'close' })
        .then(() => { console.log("Tauri launched") })
        .catch(() => { console.log("Tauri not launched") })
    }
  }, []);

  return (
    <BrowserRouter basename="/ReactCalcUPS">
      <Routes>
        <Route path="/" index element={<HomePage />} />
        <Route path="/components" element={<MainPage />} />
        <Route path="/components/:id" element={<ComponentPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/bidups/:id" element={<BidPage />} /> {/* Добавь этот маршрут */}
        <Route path="/biddetailsups/:id" element={<BidDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* Добавляем маршрут */}
        <Route path="/my-bidsups" element={<BidListingsPage />} /> {/* <-- Добавляем новый маршрут */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;