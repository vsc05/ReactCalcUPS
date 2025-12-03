// src/pages/BidPage.tsx
import { type FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { AppHeader } from "./AppHeader";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import { fetchCartAsync, removeFromCartAsync, clearCartAsync } from "./slices/cartSlice";

interface BidComponent {
  id: number;
  title: string;
  image: string;
  coeff: number;
  power: number;
  incoming_current?: number;
}

interface BidDetails {
  id: number;
  components: BidComponent[];
}

export const BidPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, token } = useAppSelector((state) => state.user);
  const cart = useAppSelector((state) => state.cart);
  
  const [bidDetails, setBidDetails] = useState<BidDetails | null>(null);
  const [hours, setHours] = useState<number>(1);
  const [incomingCurrents, setIncomingCurrents] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  // Проверяем авторизацию и перенаправляем если нет компонентов
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: `/cart/${id}` } });
    }
  }, [isAuthenticated, token, navigate, id]);

  // Загружаем детали заявки
  useEffect(() => {
    if (isAuthenticated && token && id) {
      loadBidDetails();
    }
  }, [id, isAuthenticated, token]);

  // Редирект если корзина пуста
  useEffect(() => {
    if (!loading && bidDetails && bidDetails.components.length === 0) {
      navigate('/components');
    }
  }, [loading, bidDetails, navigate]);

  const loadBidDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bidUPS/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Преобразуем данные в нужный формат
      if (data.data) {
        setBidDetails({
          id: data.data.id || parseInt(id),
          components: data.data.components || []
        });
        
        // Инициализируем значения входящего тока
        const initialCurrents: Record<number, number> = {};
        (data.data.components || []).forEach((comp: any) => {
          initialCurrents[comp.id] = comp.incoming_current || 0;
        });
        setIncomingCurrents(initialCurrents);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки заявки:', error);
      setError(error.message || 'Не удалось загрузить заявку');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setHours(value);
    }
  };

  const handleIncomingCurrentChange = (componentId: number, value: string) => {
    const numValue = parseFloat(value);
    setIncomingCurrents(prev => ({
      ...prev,
      [componentId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleDeleteComponent = async (componentId: number, bidId: number) => {
    if (!confirm('Удалить компонент из заявки?')) return;
    
    try {
      setDeletingId(componentId);
      
      const result = await dispatch(removeFromCartAsync({
        bidId: bidId,
        componentId: componentId
      })).unwrap();
      
      await loadBidDetails();
      dispatch(fetchCartAsync());
      
    } catch (error: any) {
      console.error('Ошибка удаления компонента:', error);
      alert('Не удалось удалить компонент');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!bidDetails || !confirm('Удалить все компоненты из заявки?')) return;
    
    try {
      setClearingAll(true);
      
      // Удаляем все компоненты по одному
      for (const component of bidDetails.components) {
        try {
          await dispatch(removeFromCartAsync({
            bidId: bidDetails.id,
            componentId: component.id
          })).unwrap();
        } catch (error) {
          console.warn(`Не удалось удалить компонент ${component.id}:`, error);
        }
      }
      
      await loadBidDetails();
      dispatch(fetchCartAsync());
      
      alert('Все компоненты удалены из заявки');
    } catch (error: any) {
      console.error('Ошибка очистки заявки:', error);
      alert('Не удалось очистить заявку');
    } finally {
      setClearingAll(false);
    }
  };

  const handleSave = async () => {
    if (!bidDetails) return;
    
    try {
      setSaving(true);
      setError(null);
      setResult(null);
      
      // 1. Сохраняем входящие токи для каждого компонента
      for (const component of bidDetails.components) {
        const incomingCurrent = incomingCurrents[component.id] || 0;
        
        if (incomingCurrent > 0) {
          await fetch(`/api/calcUPS/${component.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              incoming_current: incomingCurrent
            })
          });
        }
      }
      
      // 2. Устанавливаем время работы (часы) для заявки
      await fetch(`/api/bidUPS/${bidDetails.id}/set`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hours: hours
        })
      });
      
      // 3. Формируем заявку и рассчитываем мощность
      const formResponse = await fetch(`/api/bidUPS/${bidDetails.id}/form`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (formResponse.ok) {
        const formData = await formResponse.json();
        
        if (formData.data?.result || formData.result) {
          setResult(formData.data?.result || formData.result);
        }
        
        alert('Заявка успешно сохранена и рассчитана!');
      }
      
    } catch (error: any) {
      console.error('Ошибка сохранения заявки:', error);
      setError(error.message || 'Не удалось сохранить заявку');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bid-page-wrapper">
        <AppHeader />
        <div className="main-container">
          <div className="loadingBg">
            <Spinner animation="border" variant="primary" />
            <div style={{ marginTop: '10px', color: '#2CAEFF' }}>Загружаем заявку...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bid-page-wrapper">
      <AppHeader />
      
      <div className="main-container">
        <div className="form-section">
          <div className="page-header">
            <h2 className="page-title">Составление заявки</h2>
            
            <div className="header-controls">
              <div className="input-group">
                <span className="input-label"> Входящие токи, Вт</span>
                <input 
                  type="number" 
                  name="hours" 
                  className="input-field" 
                  min="1" 
                  value={hours}
                  onChange={handleHoursChange}
                  required
                />
              </div>
              
              <button 
                type="button" 
                className="save-btn"
                onClick={handleSave}
                disabled={saving || !bidDetails?.components.length}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {result && (
            <div className="result-message">
              Рассчитанная мощность ИБП: {result} Вт
            </div>
          )}
        </div>

        <div className="components-list">
          {bidDetails?.components.map((component) => (
            <div key={component.id} className="device-card">
              <div className="device-header">
                <h3 className="device-name">{component.title}</h3>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteComponent(component.id, bidDetails.id)}
                  disabled={deletingId === component.id}
                  title="Удалить компонент"
                >
                  {deletingId === component.id ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    '✕'
                  )}
                </button>
              </div>
              
              <div className="device-content">
                <div className="device-image">
                  <img 
                    src={component.image || 'http://127.0.0.1:9000/test/image4.png'} 
                    alt={component.title}
                    onError={(e) => {
                      e.currentTarget.src = 'http://127.0.0.1:9000/test/image4.png';
                    }}
                  />
                </div>
                
                <div className="device-info">
                  <div className="input-row">
                    <span className="input-label">Время работы, ч</span>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input-field"
                      value={incomingCurrents[component.id] || ''}
                      onChange={(e) => handleIncomingCurrentChange(component.id, e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="device-stats">
                    <div className="stat-item">
                      <span className="stat-label">Коэффициент мощности:</span>
                      <span className="stat-value">{component.coeff}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Мощность:</span>
                      <span className="stat-value">{component.power} Вт</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {bidDetails && bidDetails.components.length > 0 && (
          <div className="clear-all-section">
            <button 
              className="clear-all-btn"
              onClick={handleClearAll}
              disabled={clearingAll}
            >
              {clearingAll ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Удаление...
                </>
              ) : (
                'Удалить все компоненты'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Стили */}
      <style>
        {`
          .bid-page-wrapper {
            background-color: #f5f9ff;
            min-height: 100vh;
            padding-bottom: 40px;
          }

          .main-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }

          .form-section {
            background-color: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
          }

          .page-title {
            color: #2CAEFF;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            flex: 1;
            min-width: 300px;
          }

          .header-controls {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
          }

          .input-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .input-label {
            color: #2CAEFF;
            font-size: 16px;
            font-weight: bold;
            white-space: nowrap;
          }

          .input-field {
            border: 2px solid #2CAEFF;
            border-radius: 5px;
            padding: 8px 12px;
            font-size: 16px;
            width: 120px;
            text-align: center;
          }

          .save-btn {
            background-color: #2CAEFF;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
            min-width: 120px;
          }

          .save-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }

          .error-message {
            color: #ff4757;
            margin-top: 15px;
            padding: 10px;
            background-color: #fff5f5;
            border-radius: 5px;
            border: 1px solid #ffcccc;
          }

          .result-message {
            color: #2CAEFF;
            font-weight: bold;
            margin-top: 15px;
            padding: 10px;
            background-color: #f0f9ff;
            border-radius: 5px;
            border: 1px solid #2CAEFF;
          }

          .components-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .device-card {
            background-color: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .device-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
          }

          .device-name {
            color: #2CAEFF;
            font-size: 22px;
            font-weight: bold;
            margin: 0;
          }

          .delete-btn {
            background: none;
            border: 2px solid #ff4757;
            color: #ff4757;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 20px;
            font-weight: bold;
            transition: all 0.2s;
          }

          .delete-btn:hover:not(:disabled) {
            background-color: #ff4757;
            color: white;
          }

          .delete-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .device-content {
            display: flex;
            gap: 30px;
            align-items: flex-start;
          }

          .device-image {
            flex: 0 0 150px;
          }

          .device-image img {
            width: 150px;
            height: 150px;
            object-fit: contain;
            border-radius: 8px;
            background-color: #f5f9ff;
            padding: 10px;
          }

          .device-info {
            flex: 1;
          }

          .input-row {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
            padding: 10px 0;
          }

          .device-stats {
            background-color: #f5f9ff;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #2CAEFF;
          }

          .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }

          .stat-item:last-child {
            margin-bottom: 0;
          }

          .stat-label {
            color: #2CAEFF;
            font-size: 16px;
            font-weight: bold;
          }

          .stat-value {
            color: #2CAEFF;
            font-size: 16px;
          }

          .clear-all-section {
            margin-top: 30px;
            text-align: center;
          }

          .clear-all-btn {
            background-color: #ff4757;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
          }

          .clear-all-btn:hover:not(:disabled) {
            background-color: #ff6b81;
          }

          .clear-all-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .main-container {
              padding: 15px;
            }
            
            .page-header {
              flex-direction: column;
              align-items: stretch;
            }
            
            .header-controls {
              flex-direction: column;
              align-items: stretch;
            }
            
            .input-group {
              justify-content: space-between;
            }
            
            .device-content {
              flex-direction: column;
              gap: 20px;
            }
            
            .device-image {
              align-self: center;
            }
          }

          @font-face {
            font-family: "ALS Sector Bold Bold";
            src: url("https://db.onlinewebfonts.com/t/55c75572ae1d9f96d61851294e1698ec.eot");
            src: url("https://db.onlinewebfonts.com/t/55c75572ae1d9f96d61851294e1698ec.eot?#iefix")format("embedded-opentype"),
            url("https://db.onlinewebfonts.com/t/55c75572ae1d9f96d61851294e1698ec.woff2")format("woff2"),
            url("https://db.onlinewebfonts.com/t/55c75572ae1d9f96d61851294e1698ec.woff")format("woff"),
            url("https://db.onlinewebfonts.com/t/55c75572ae1d9f96d61851294e1698ec.ttf")format("truetype"),
            url("https://db.onlinewebfonts.com/t/55c75572ae1d9f96d61851294e1698ec.svg#ALS Sector Bold Bold")format("svg");
          }

          @font-face {
            font-family: "ALS Sector Regular";
            src: url("https://db.onlinewebfonts.com/t/0915cee867624e0c356dd676beb2dcee.eot");
            src: url("https://db.onlinewebfonts.com/t/0915cee867624e0c356dd676beb2dcee.eot?#iefix")format("embedded-opentype"),
            url("https://db.onlinewebfonts.com/t/0915cee867624e0c356dd676beb2dcee.woff2")format("woff2"),
            url("https://db.onlinewebfonts.com/t/0915cee867624e0c356dd676beb2dcee.woff")format("woff"),
            url("https://db.onlinewebfonts.com/t/0915cee867624e0c356dd676beb2dcee.ttf")format("truetype"),
            url("https://db.onlinewebfonts.com/t/0915cee867624e0c356dd676beb2dcee.svg#ALS Sector Regular")format("svg");
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: "ALS Sector Regular", sans-serif;
          }
        `}
      </style>
    </div>
  );
};

export default BidPage;