import { type FC } from 'react';
import { Link } from 'react-router-dom'; // Добавляем Link для перехода на главную
import { NavigationMenu } from './NavBar'; // ⬅️ Импортируем компонент навигации
import './components/AppHeader.css'; 


export const AppHeader: FC = () => {
  return (
    <header className="app-header-container">
      <div className="app-header-content">
        
        <Link to="/" className="app-header-link">
          <img 
            src="http://127.0.0.1:9000/test/image2.png" 
            alt="Молния"
            className="header-icon" 
          />
          <h1 className="page-top-header">Вычисление мощности ИБП</h1>
        </Link>
        
        <NavigationMenu /> 
      </div>
    </header>
  );
};
