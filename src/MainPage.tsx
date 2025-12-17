import { type FC, useEffect, useState } from "react";
import "./components/MainPage.css";
import { Spinner } from "react-bootstrap";
import { BreadCrumbs } from "./BreadCrumbs"; 
import { AppHeader } from "./AppHeader";
import { Link } from "react-router-dom";
import defaultImage from "./DefaultImage.png";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import { 
  setSearchValue, 
  addToSearchHistory 
} from "./slices/searchSlice";
import { 
  fetchComponents, 
  filterComponents 
} from "./slices/componentsSlice";
import { getCartIcon, type ComponentResponse } from "./modules/componentApi";

// DeviceCard компонент остается без изменений
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
        <Link to={`/components/${id}`} className="btn-details">
          Подробнее
        </Link>
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
  const dispatch = useAppDispatch();
  
  // Получаем состояние из Redux
  const { searchValue } = useAppSelector((state) => state.search);
  const { 
    filteredItems: components, 
    loading, 
    error 
  } = useAppSelector((state) => state.components);

  const [cartLoading, setCartLoading] = useState(false);

  // Загрузка компонентов при монтировании
  useEffect(() => {
    dispatch(fetchComponents(searchValue));
  }, [dispatch]);

  // При изменении поискового запроса фильтруем компоненты
  useEffect(() => {
    if (searchValue) {
      dispatch(filterComponents({ searchValue }));
    }
  }, [searchValue, dispatch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Добавляем запрос в историю
    if (searchValue) {
      dispatch(addToSearchHistory(searchValue));
    }
    // Загружаем компоненты с новым поисковым запросом
    dispatch(fetchComponents(searchValue));
  };

  const handleSearchChange = (value: string) => {
    dispatch(setSearchValue(value));
  };

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    console.log("Cart icon clicked - starting request");
    
    setCartLoading(true);
    try {
      console.log("Calling getCartIcon...");
      const cartData: ComponentResponse = await getCartIcon();
      console.log("Cart data received:", cartData);
    } catch (error) {
      console.error("Error fetching cart data:", error);
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <div className="devices-page-wrapper">
      <header>
        <AppHeader />
      </header>

      <div style={{ width: '100%', maxWidth: '1200px', padding: '0 20px' }}>
        <BreadCrumbs crumbs={[{ label: "Компоненты" }]} />
      </div>

      <h1>Устройства</h1>

      <form className="search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          name="query"
          placeholder="Поиск компонентов"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <button type="submit">Найти</button>
      </form>

      {loading && (
        <div className="loadingBg">
          <Spinner animation="border" />
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center", color: "red", margin: "20px 0" }}>
          {error}
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
        <Link to="#" className="cart-icon" onClick={handleCartClick}>
          <img src="http://127.0.0.1:9000/test/image4.png" alt="Корзина" />
        </Link>
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