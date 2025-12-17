import { type FC, useState, useEffect, useCallback } from "react";
import "./components/MainPage.css";
import { Spinner } from "react-bootstrap";
import { type Component, getComponentsByTitle, getCartIcon, type ComponentResponse } from "./modules/componentApi"; 
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
  const [cartLoading, setCartLoading] = useState(false);
  const cartCount = 0;

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

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    console.log("Cart icon clicked - starting request");
    
    setCartLoading(true);
    try {
      console.log("Calling getCartIcon...");
      const cartData: ComponentResponse = await getCartIcon();
      console.log("Cart data received:", cartData);
      console.log("Full cart response:", JSON.stringify(cartData, null, 2));
    } catch (error) {
      console.error("Error fetching cart data:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setCartLoading(false);
    }
  };

  // Тестовый вызов для проверки работы функции
  useEffect(() => {
    console.log("Component mounted - testing getCartIcon");
    // Раскомментируйте для тестирования при загрузке компонента
    // getCartIcon().then(data => console.log("Test cart data:", data));
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

      <div style={{ position: 'relative' }}>
        <a href="#" className="cart-icon" onClick={handleCartClick}>
          <img src="http://127.0.0.1:9000/test/image4.png" alt="Корзина" />
        </a>
        {cartLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}>
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DevicesPage;