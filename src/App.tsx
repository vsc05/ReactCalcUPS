import { BrowserRouter, Route, Routes } from "react-router-dom";
// import { AlbumPage } from "./AlbumPage";
import MainPage from "./MainPage";
import HomePage from "./HomePage";
import { ComponentPage } from "./ComponentPage";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";


function App() {
  useEffect(()=>{
    invoke('tauri', {cmd:'create'})
      .then(() =>{console.log("Tauri launched")})
      .catch(() =>{console.log("Tauri not launched")})
    return () =>{
      invoke('tauri', {cmd:'close'})
        .then(() =>{console.log("Tauri launched")})
        .catch(() =>{console.log("Tauri not launched")})
    }
  }, [])

  return (
    <BrowserRouter basename="/ReactCalcUPS">
      <Routes>
        <Route path="/"index element={<HomePage />} />
        <Route path="/components" element={<MainPage />} />
        <Route path="/components/:id" element={<ComponentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;