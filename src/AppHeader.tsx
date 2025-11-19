import { type FC } from "react";
import { Link } from "react-router-dom";
import { NavigationMenu } from "./NavBar";
import molniaImage from "./components/molnia.png"; 
import './components/AppHeader.css'; 

export const AppHeader: FC = () => {
  return (
    <header className="app-header-container">
      <div className="app-header-content">
        
        <Link to="/" className="app-header-link">
          <img 
            src={molniaImage} // Используем импортированную переменную
            alt="Молния"
            className="header-icon" 
          />
        <h1 className="page-top-header">Вычисление мощности ИБП</h1>
        </Link>
      </div>
      <NavigationMenu /> 
    </header>
  );
};