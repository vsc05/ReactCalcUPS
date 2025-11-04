import { type FC, useState, useEffect, useCallback } from "react";
import "./components/MainPage.css";
import { Spinner } from "react-bootstrap";
import { type Component, getComponentsByTitle } from "./modules/componentApi"; 
import { COMPONENTS_MOCK } from "./modules/mock"; 
import { BreadCrumbs } from "./BreadCrumbs"; 
import { ROUTE_LABELS } from "../Routes";
import { AppHeader } from "./AppHeader";
import defaultImage from "./DefaultImage.png"

interface DeviceCardProps {
  id: number;
  title: string;
  image: string;
}

const DeviceCard: FC<DeviceCardProps> = ({ id, title, image }) => {
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Добавить компонент ID: ${id} в заявку`);
  };

  return (
    <div className="card">
      <img src={image || defaultImage} alt="Изображение" className="card-image" />
      <div className="card-title">{title}</div>
      <div className="card-actions">
        <a href={`/components/${id}`} className="btn-details">
          Подробнее
        </a>
        <form method="POST" action="/add-to-bid" style={{ display: "inline" }} onSubmit={handleAddSubmit}>
          <input type="hidden" name="component_id" value={id} />
          <button type="submit" className="btn-add">
            В заявку
          </button>
        </form>
      </div>
    </div>
  );
};

export const DevicesPage: FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const cartCount = 2;

  const loadComponents = useCallback((query: string = "") => {
    setLoading(true);
    getComponentsByTitle(query)
      .then((response) => {
        const list = response?.data?.Components?.filter((item) => !item.is_delete) || [];
        setComponents(list);
      })
      .catch((error) => {
        console.error("Ошибка при запросе компонентов:", error);
        setComponents(COMPONENTS_MOCK); 
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComponents(searchValue);
  };

  return (
    <div className="devices-page-wrapper">
      <header>
       <AppHeader />
      </header>

      <div style={{ width: '100%', maxWidth: '1200px', padding: '0 20px' }}>
          <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.COMPONENTS || 'Устройства' }]} />
      </div>

      <h1>Устройства</h1>

      <form className="search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          name="query"
          placeholder="Поиск компонентов"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <button type="submit">Найти</button>
      </form>

      {loading && (
        <div className="loadingBg">
          <Spinner animation="border" />
        </div>
      )}

      <div className={`devices-container ${loading ? "containerLoading" : ""}`}>
        {components.length === 0 && !loading ? (
          <p style={{ textAlign: "center", width: "100%", color: "#2CAEFF", fontSize: '22px' }}>
            Компоненты не найдены :(
          </p>
        ) : (
          components.map((item) => (
            <DeviceCard
              key={item.id}
              id={item.id}
              title={item.title}
              image={item.image} 
            />
          ))
        )}
      </div>

      <a href="/calcups/7" className="cart-icon">
        <img src="http://127.0.0.1:9000/test/image4.png" alt="Корзина" />
        <span className="cart-count">{cartCount}</span>
      </a>
    </div>
  );
};

export default DevicesPage;