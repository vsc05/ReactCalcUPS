// src/MainPage.tsx
import { type FC, useEffect, useState } from "react";
import "./components/MainPage.css";
import { Spinner } from "react-bootstrap";
import { BreadCrumbs } from "./BreadCrumbs"; 
import { AppHeader } from "./AppHeader";
import { Link, useNavigate } from "react-router-dom";
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
import { 
  fetchCartAsync, 
  addToCartAsync, 
  updateCartState,
  selectCart,
  selectCartItemsCount,
  selectCartLoading,
  incrementCartCount,
  decrementCartCount
} from "./slices/cartSlice";

interface DeviceCardProps {
  id: number;
  title: string;
  image: string;
  onAddToCart: (id: number) => Promise<void>;
  adding: boolean;
  disabled?: boolean;
}

const DeviceCard: FC<DeviceCardProps> = ({ id, title, image, onAddToCart, adding, disabled }) => {
  const [isLocalAdding, setIsLocalAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsLocalAdding(true);
    try {
      await onAddToCart(id);
    } finally {
      setIsLocalAdding(false);
    }
  };

  const isLoading = adding || isLocalAdding;

  return (
    <div className="card">
      <img src={image || defaultImage} alt={title} className="card-image" />
      <div className="card-title">{title}</div>
      <div className="card-actions">
        <Link to={`/components/${id}`} className="btn-details">
          Подробнее
        </Link>
        <button 
          onClick={handleAddToCart}
          className="btn-add"
          disabled={disabled || isLoading}
          title={disabled ? "Войдите в систему для добавления в корзину" : ""}
        >
          {isLoading ? 'Добавляем...' : 'В заявку'}
        </button>
      </div>
    </div>
  );
};

export const DevicesPage: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { searchValue } = useAppSelector((state) => state.search);
  const { 
    filteredItems: components, 
    loading: componentsLoading, 
    error: componentsError 
  } = useAppSelector((state) => state.components);

  const cart = useAppSelector(selectCart);
  const cartItemsCount = useAppSelector(selectCartItemsCount);
  const cartLoading = useAppSelector(selectCartLoading);
  const { isAuthenticated, token } = useAppSelector((state) => state.user);

  const [addingId, setAddingId] = useState<number | null>(null);
  const [localCartCount, setLocalCartCount] = useState(cart.count_items);

  // Синхронизируем локальное состояние с глобальным
  useEffect(() => {
    setLocalCartCount(cart.count_items);
  }, [cart.count_items]);

  useEffect(() => {
    dispatch(fetchComponents(searchValue));
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && token) {
      dispatch(fetchCartAsync());
    } else {
      dispatch(updateCartState({
        bid_id: null,
        count_items: 0,
        loading: false
      }));
      setLocalCartCount(0);
    }
  }, [dispatch, isAuthenticated, token]);

  useEffect(() => {
    if (searchValue.trim()) {
      dispatch(filterComponents({ searchValue }));
    }
  }, [searchValue, dispatch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = searchValue.trim();
    
    if (trimmedValue) {
      dispatch(addToSearchHistory(trimmedValue));
      dispatch(fetchComponents(trimmedValue));
    }
  };

  const handleSearchChange = (value: string) => {
    dispatch(setSearchValue(value));
  };

  const handleAddToCart = async (id: number): Promise<void> => {
    if (!isAuthenticated) {
      alert('Для добавления товаров в корзину необходимо войти в систему');
      navigate('/login', { state: { from: '/components' } });
      return;
    }
    
    setAddingId(id);
    
    // Оптимистичное обновление: сразу увеличиваем счетчик
    setLocalCartCount(prev => prev + 1);
    dispatch(incrementCartCount());
    
    try {
      const result = await dispatch(addToCartAsync(id)).unwrap();
      
      if (result?.data) {
        // Обновляем состояние корзины из ответа сервера
        const serverCount = result.data.items_count || result.data.count_items || 0;
        dispatch(updateCartState({
          bid_id: result.data.bid_id,
          count_items: serverCount,
          loading: false
        }));
        
        // Синхронизируем локальное состояние с серверным
        setLocalCartCount(serverCount);
        
        // Показываем уведомление
        const addedItem = components.find(item => item.id === id);
        if (addedItem) {
          alert(`Товар "${addedItem.title}" добавлен в корзину!`);
        }
      }
    } catch (error: any) {
      // Откатываем оптимистичное обновление при ошибке
      setLocalCartCount(prev => Math.max(0, prev - 1));
      dispatch(decrementCartCount());
      
      if (error.message?.includes('Токен не найден') || error.message?.includes('401')) {
        navigate('/login');
      } else {
        alert('Не удалось добавить товар в корзину');
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Обновляем корзину перед переходом
    dispatch(fetchCartAsync());
    
    if (cart.bid_id) {
      navigate(`/cart/${cart.bid_id}`);
    } else {
      alert('Корзина пуста. Добавьте товары, чтобы оформить заказ.');
    }
  };

  // Используем localCartCount для отображения, но если корзина загружается, показываем "..." 
  const displayCount = cart.loading ? '...' : localCartCount;
  
  // Функция для проверки, нужно ли показывать красный бейдж
  const shouldShowRedBadge = isAuthenticated && 
    typeof displayCount === 'number' && 
    displayCount > 0;
  
  // Функция для проверки, нужно ли показывать серый бейдж
  const shouldShowGrayBadge = isAuthenticated && 
    (displayCount === 0 || displayCount === '...');

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
          disabled={componentsLoading}
        />
        <button 
          type="submit" 
          disabled={componentsLoading}
        >
          {componentsLoading ? 'Поиск...' : 'Найти'}
        </button>
      </form>

      {componentsLoading && (
        <div className="loadingBg">
          <Spinner animation="border" variant="primary" />
          <div style={{ marginTop: '10px', color: '#2CAEFF' }}>Загружаем компоненты...</div>
        </div>
      )}

      {componentsError && (
        <div style={{ 
          textAlign: "center", 
          color: "red", 
          margin: "20px 0",
          padding: "15px",
          backgroundColor: "#fff5f5",
          borderRadius: "8px",
          border: "1px solid #ffcccc"
        }}>
          <strong>Ошибка загрузки:</strong> {componentsError}
        </div>
      )}

      <div className={`devices-container ${componentsLoading ? "containerLoading" : ""}`}>
        {components.length === 0 && !componentsLoading ? (
          <div style={{ 
            textAlign: "center", 
            width: "100%", 
            padding: "40px 20px",
            color: "#666"
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
            <p style={{ color: "#2CAEFF", fontSize: '22px', marginBottom: '10px' }}>
              Компоненты не найдены
            </p>
            <p style={{ color: "#888", fontSize: '16px' }}>
              Попробуйте изменить поисковый запрос
            </p>
          </div>
        ) : (
          components.map((item) => (
            <DeviceCard
              key={item.id}
              id={item.id}
              title={item.title}
              image={item.image}
              onAddToCart={handleAddToCart}
              adding={addingId === item.id}
              disabled={!isAuthenticated}
            />
          ))
        )}
      </div>

      {/* Корзина */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 1000 
      }}>
        <div style={{ position: 'relative' }}>
          <Link 
            to={isAuthenticated && cart.bid_id ? `/cart/${cart.bid_id}` : "#"}
            className="cart-icon" 
            onClick={handleCartClick}
            style={{ 
              display: 'block',
              opacity: isAuthenticated ? 1 : 0.5,
              cursor: isAuthenticated ? 'pointer' : 'not-allowed'
            }}
          >
            <img 
              src="http://127.0.0.1:9000/test/image4.png" 
              alt="Корзина" 
              style={{ 
                width: '60px', 
                height: '60px'
              }}
            />
            
            {shouldShowRedBadge && (
              <span 
                className="cart-badge"
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#ff4757',
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: '25px',
                  height: '25px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  animation: addingId ? 'pulse 0.5s infinite' : 'none'
                }}
              >
                {displayCount > 99 ? '99+' : displayCount}
              </span>
            )}
            
            {shouldShowGrayBadge && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#cccccc',
                  color: '#666666',
                  borderRadius: '50%',
                  width: '25px',
                  height: '25px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  opacity: cart.loading ? 0.5 : 1
                }}
              >
                {displayCount}
              </span>
            )}
          </Link>
          
          {cart.loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}>
              <Spinner animation="border" size="sm" variant="primary" />
            </div>
          )}
        </div>
      </div>

      {/* CSS для анимации */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default DevicesPage;