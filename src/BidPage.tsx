import { type FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { AppHeader } from "./AppHeader"; // ⭐️ Импорт AppHeader оставлен, как в оригинале ⭐️
import { useAppDispatch, useAppSelector } from "./hooks/redux"; 
import { 
  fetchCartAsync, 
  removeFromCartAsync,
  saveBidIncomingCurrentAsync, 
  formBidAsync,               
  clearCartAsync,             
  selectCartLoading,
  selectCartError,
  selectCalculationResult,
  clearCartError,
} from "./slices/cartSlice"; 
import defaultImage from "./DefaultImage.png"; 

interface BidComponent {
  id: number;               // <--- ID записи CalcUPS
  component_id: number;     // <--- ID самого компонента
  title: string;
  image: string;
  coeff: number;
  power: number;
  count: number; 
  battery_life?: number; 
  calculated_power?: number;
}

interface BidDetails {
  id: number;
  components: BidComponent[];
}

// Вспомогательный компонент для отображения сообщений
const NotificationMessage: FC<{ type: 'error' | 'success', message: string }> = ({ type, message }) => (
    <div className={type === 'error' ? 'error-message' : 'success-message'}>
        {message}
    </div>
);


export const BidPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, token } = useAppSelector((state) => state.user);
  
  // ⭐️ ИСПОЛЬЗУЕМ REDUX STATE ⭐️
  const cartLoading = useAppSelector(selectCartLoading);
  const cartError = useAppSelector(selectCartError);
  const calculationResult = useAppSelector(selectCalculationResult);
  
  const [bidDetails, setBidDetails] = useState<BidDetails | null>(null);
  const [hours, setHours] = useState<number>(1);
  const [batteryLifeInputs, setBatteryLifeInputs] = useState<Record<number, number>>({}); 
  const [componentCounts, setComponentCounts] = useState<Record<number, number>>({}); 
  
  const [loading, setLoading] = useState(true);
  
  const [savingComponentId, setSavingComponentId] = useState<number | null>(null); 
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null); 
  
  const [deletingId, setDeletingId] = useState<number | null>(null);


  const clearMessages = () => {
    // 🚨 Очищаем ошибки через Redux
    dispatch(clearCartError()); 
    setSuccessMessage(null);
  };
  
  // 1. Проверяем авторизацию (без изменений)
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: `/bidups/${id}` } });
    }
  }, [isAuthenticated, token, navigate, id]);

  // 2. Загружаем детали заявки
  useEffect(() => {
    if (isAuthenticated && token && id) {
      loadBidDetails();
    }
  }, [id, isAuthenticated, token]);
  
  // 3. Редирект если корзина пуста (без изменений)
  useEffect(() => {
    if (!loading && bidDetails && bidDetails.components.length === 0) {
      navigate('/components');
    }
  }, [loading, bidDetails, navigate]);

  const loadBidDetails = async () => {
    if (!token || !id) return;
    clearMessages(); // Очищаем сообщения при новой загрузке
    
    try {
      setLoading(true);
      
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
      
      if (data.data) {
        console.log('--- Bid Details Loaded ---');
        
        const components: BidComponent[] = (data.data.components || []).map((comp: any) => {
             const mappedComp = {
                 id: comp.id, 
                 component_id: comp.component_id, 
                 title: comp.title,
                 image: comp.image,
                 coeff: comp.coeff,
                 power: comp.power,
                 count: comp.count || 1,
                 battery_life: comp.battery_life || 0,
                 calculated_power: comp.calculated_power || 0,
             };
             return mappedComp;
        });
          
        setBidDetails({
          id: data.data.id || parseInt(id),
          components: components
        });
        
        const initialBatteryLife: Record<number, number> = {};
        const initialCounts: Record<number, number> = {};
          
        components.forEach((comp) => {
          initialBatteryLife[comp.id] = comp.battery_life || 0;
          initialCounts[comp.id] = comp.count || 1; 
        });
        
        setBatteryLifeInputs(initialBatteryLife);
        setComponentCounts(initialCounts);
        
        // 🚨 Используем incoming_current для установки hours
        if (data.data.incoming_current) {
             setHours(data.data.incoming_current);
        } else if (data.data.hours) {
             // Fallback, если incoming_current не пришел
             setHours(data.data.hours);
        }
        
      }
    } catch (error: any) {
      console.error('Ошибка загрузки заявки:', error);
      setSuccessMessage(null);
      
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

  const handleBatteryLifeChange = (componentId: number, value: string) => {
    const numValue = parseFloat(value);
    setBatteryLifeInputs(prev => ({
      ...prev,
      [componentId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleLocalCountChange = (componentId: number, newCount: number) => {
    if (newCount < 1) return;

    setComponentCounts(prev => ({
      ...prev,
      [componentId]: newCount
    }));
  };
  
  const handleIncrementCount = (componentId: number) => {
    handleLocalCountChange(componentId, (componentCounts[componentId] || 1) + 1);
  };
  
  const handleDecrementCount = (componentId: number) => {
    const currentCount = componentCounts[componentId] || 1;
    if (currentCount > 1) {
        handleLocalCountChange(componentId, currentCount - 1);
    }
  };

  const handleDeleteComponent = async (componentId: number, bidId: number) => {
    clearMessages();
    
    try {
      setDeletingId(componentId);
      
      await dispatch(removeFromCartAsync({
        bidId: bidId,
        componentId: componentId // ID CalcUPS
      })).unwrap();
      
      await loadBidDetails();
      dispatch(fetchCartAsync());
      
      setSuccessMessage('Компонент успешно удален.');
      
    } catch (error: any) {
      console.error('Ошибка удаления компонента:', error);
      setSuccessMessage(`Не удалось удалить компонент: ${error.message || 'ошибка сети'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!bidDetails || !id) return;
    
    clearMessages();
    
    try {
      // 🚨 ИСПОЛЬЗУЕМ REDUX THUNK
      await dispatch(clearCartAsync()).unwrap();
      
      setBidDetails(null);
      dispatch(fetchCartAsync());
      
      setSuccessMessage('Все компоненты удалены из заявки.');
      navigate('/components');
      
    } catch (error: any) {
      console.error('Ошибка очистки заявки:', error);
    }
  };

  const handleSaveComponent = async (component: BidComponent) => {
    if (!token || !bidDetails) return;
    clearMessages();

    const calcUpsId = component.id; 
    const componentIdForBackend = calcUpsId; 
    
    if (!componentIdForBackend) {
        setSuccessMessage('Невозможно сохранить: отсутствует ID для отправки.');
        setSavingComponentId(null);
        return;
    }

    const count = componentCounts[calcUpsId] || 1; 
    const batteryLife = batteryLifeInputs[calcUpsId] || 0;
    
    const requestBody = {
        bid_id: bidDetails.id, 
        component_id: componentIdForBackend, 
        battery_life: batteryLife, 
        count: count
    };

    try {
      setSavingComponentId(calcUpsId);
      
      const url = `/api/calcUPS`; 
      
      const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка сохранения: ${response.status} - ${errorText}`);
      }

      await loadBidDetails();
      setSuccessMessage(`Изменения для компонента ${component.title} успешно сохранены.`);
      
    } catch (error: any) {
      console.error(`Ошибка сохранения компонента ${calcUpsId}:`, error);
      setSuccessMessage(`Не удалось сохранить компонент: ${error.message || 'ошибка сети'}`);
    } finally {
      setSavingComponentId(null);
    }
  };


  const handleSave = async () => {
    if (!bidDetails) return;
    clearMessages();
    
    try {
      
      // 1. 🚨 СОХРАНЕНИЕ ВХОДЯЩИХ ТОКОВ
      await dispatch(saveBidIncomingCurrentAsync({
          bidId: bidDetails.id, 
          incomingCurrent: hours
      })).unwrap();
      
      // 2. 🚨 ФОРМИРОВАНИЕ И РАСЧЕТ
      await dispatch(formBidAsync(bidDetails.id)).unwrap();
      
      // 3. УСПЕХ
      setSuccessMessage('Входящие токи сохранены. Заявка сформирована и выполнен расчет!');
      
      await loadBidDetails(); // Перезагружаем данные заявки

      navigate('/components');
      
    } catch (error: any) {
      console.error('Ошибка сохранения/расчета заявки:', error);
      setSuccessMessage(null);
    }
  };


  if (loading || cartLoading) {
    return (
      <div className="bid-page-wrapper">
        <AppHeader />
        <div className="main-container">
          <div className="loadingBg" style={{ textAlign: 'center', padding: '50px' }}>
            <Spinner animation="border" variant="primary" />
            <div style={{ marginTop: '10px', color: '#2CAEFF' }}>
                {loading ? 'Загружаем заявку...' : 'Выполняем операцию...'}
            </div>
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
              {/* Общее время работы для заявки */}
              <div className="input-group">
                {/* Текст поля ввода */}
                <span className="input-label">Входящие токи, Вт</span>
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
                disabled={cartLoading || !bidDetails?.components.length}
              >
                {/* Текст кнопки */}
                {cartLoading ? 'Расчет...' : 'Сформировать'}
              </button>
            </div>
          </div>

          {/* Сообщения об ошибке/успехе */}
          {/* 🚨 Ошибка из Redux 🚨 */}
          {cartError && <NotificationMessage type="error" message={cartError} />}
          {/* ⭐️ Сообщение об успехе локальное (для сохранения/удаления) ⭐️ */}
          {successMessage && !cartError && <NotificationMessage type="success" message={successMessage} />}

          {/* 🚨 Результат расчета из Redux 🚨 */}
          {calculationResult !== null && (
            <div className="result-message">
              Рассчитанная мощность ИБП: {calculationResult} Вт
            </div>
          )}
        </div>

        <div className="components-list">
          {!bidDetails?.components.length && (
            <div className="empty-message">В заявке нет компонентов. Добавьте устройства со страницы "Компоненты".</div>
          )}
          {bidDetails?.components.map((component) => {
            const isSavingThisComponent = savingComponentId === component.id;
            
            return (
              <div key={component.id} className="device-card">
                <div className="device-header">
                  <h3 className="device-name">{component.title}</h3>
                  
                  {/* КНОПКА СОХРАНЕНИЯ КОМПОНЕНТА */}
                   <button
                      className="save-component-btn"
                      onClick={() => handleSaveComponent(component)} 
                      disabled={isSavingThisComponent || deletingId === component.id || cartLoading}
                    >
                      {isSavingThisComponent ? 
                        (
                           <>
                              <Spinner animation="border" size="sm" />
                              Сохранение...
                           </>
                        ) : 
                        'Сохранить изменения'
                      }
                    </button>

                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteComponent(component.id, bidDetails.id)}
                    disabled={deletingId === component.id || isSavingThisComponent}
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
                      src={component.image || defaultImage} 
                      alt={component.title}
                      onError={(e) => {
                        e.currentTarget.src = defaultImage;
                      }}
                    />
                  </div>
                  
                  <div className="device-info">
                    
                    {/* БЛОК: Управление количеством */}
                    <div className="input-row count-control-row">
                      <span className="input-label">Количество:</span>
                      <div className="count-control">
                        <button 
                          className="count-btn minus-btn"
                          onClick={() => handleDecrementCount(component.id)}
                          disabled={(componentCounts[component.id] || 1) <= 1 || isSavingThisComponent} 
                        >
                          –
                        </button>
                        <input 
                          type="number" 
                          className="input-field count-field"
                          value={componentCounts[component.id] ?? 1} 
                          min="1"
                          onChange={(e) => handleLocalCountChange(component.id, parseInt(e.target.value) || 1)}
                          required
                          disabled={isSavingThisComponent}
                        />
                        <button 
                          className="count-btn plus-btn"
                          onClick={() => handleIncrementCount(component.id)}
                          disabled={isSavingThisComponent}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {/* ВВОД: Время работы, ч (BatteryLife) */}
                    <div className="input-row">
                      <span className="input-label">Время работы, ч</span>
                      <input 
                        type="number" 
                        step="0.1" 
                        className="input-field"
                        value={batteryLifeInputs[component.id] || ''}
                        onChange={(e) => handleBatteryLifeChange(component.id, e.target.value)}
                        required
                        disabled={isSavingThisComponent}
                      />
                    </div>
                    
                    {/* device-stats */}
                    <div className="device-stats">
                      <div className="stat-item">
                        <span className="stat-label">Коэффициент мощности:</span>
                        <span className="stat-value">{component.coeff}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Мощность (одна ед.):</span>
                        <span className="stat-value">{component.power} Вт</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {bidDetails && bidDetails.components.length > 0 && (
          <div className="clear-all-section">
            <button 
              className="clear-all-btn"
              onClick={handleClearAll}
              disabled={cartLoading}
            >
              {cartLoading ? (
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

      <style>
        {`
          /* === Общие стили и шрифты === */
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

          .bid-page-wrapper {
            background-color: #f5f9ff;
            min-height: 100vh;
            padding-bottom: 40px;
          }
          
          /* === Стили для хедера удалены! === */

          .main-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          
          /* === Секция формы и заголовка === */
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

          /* === Сообщения и результаты === */
          .error-message {
            color: #ff4757;
            margin-top: 15px;
            padding: 10px;
            background-color: #fff5f5;
            border-radius: 5px;
            border: 1px solid #ffcccc;
            font-weight: bold;
          }
          
          .success-message {
            color: #4CAF50;
            margin-top: 15px;
            padding: 10px;
            background-color: #f7fff5;
            border-radius: 5px;
            border: 1px solid #4CAF50;
            font-weight: bold;
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
          
          .empty-message {
            text-align: center;
            color: #777;
            padding: 30px;
            border: 1px dashed #ccc;
            border-radius: 8px;
            margin-top: 20px;
          }

          /* === Список компонентов === */
          .components-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .device-card {
            background-color: white;
            border-radius: 10px;
            padding: 8px 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .device-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px; 
            padding-bottom: 3px; 
            border-bottom: 2px solid #f0f0f0;
            gap: 8px; 
          }
          
          .device-name {
            color: #2CAEFF;
            font-size: 22px;
            font-weight: bold;
            margin: 0;
            flex-grow: 1; 
          }

          .save-component-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            font-size: 15px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
            margin: 0; 
            min-width: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            order: 2; 
          }
          
          .save-component-btn:hover:not(:disabled) {
             background-color: #45a049;
          }

          .save-component-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
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
            order: 3; 
          }

          .delete-btn:hover:not(:disabled) {
            background-color: #ff4757;
            color: white;
          }

          .delete-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* === Содержимое компонента === */
          .device-content {
            display: flex;
            gap: 20px;
            align-items: flex-start;
          }
          
          .device-image {
            flex: 0 0 200px;
            height: 200px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 10px;
            overflow: hidden;
            border: 4px solid #2CAEFF;
            padding: 20px;
          }

          .device-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          
          .device-info {
            flex: 1;
          }

          .input-row {
            display: flex;
            align-items: center;
            gap: 420px; 
            margin-bottom: 3px; 
            padding: 3px 0; 
            justify-content: space-between; 
          }
          
          .count-control-row {
            padding: 0; 
            margin-bottom: 5px;
          }

          /* === Управление количеством === */
          .count-control {
            display: flex;
            align-items: center;
          }

          .count-btn {
            background-color: #2CAEFF;
            color: white;
            border: none;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .count-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }

          .minus-btn {
            border-radius: 5px 0 0 5px;
          }
          
          .plus-btn {
            border-radius: 0 5px 5px 0;
          }

          .count-field {
            width: 50px;
            text-align: center;
            padding: 5px;
            border-radius: 0;
            border-left: none;
            border-right: none;
            height: 35px;
            border: 2px solid #2CAEFF;
          }
          
          .input-row .input-field {
            width: 150px; 
            text-align: center;
            border: 2px solid #2CAEFF;
            border-radius: 5px;
            padding: 8px 12px;
            font-size: 16px;
          }
          .input-row .count-field {
             width: 50px;
             padding: 5px;
          }

          /* === Статистика === */
          .device-stats {
            background-color: #f5f9ff;
            border-radius: 8px;
            padding: 8px 12px; 
            border: 1px solid #2CAEFF;
            margin-top: 8px; 
          }

          .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px; 
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

          /* === Секция "Удалить все" === */
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
          
          /* === Адаптивность === */
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
            
            .device-header {
                flex-wrap: wrap;
            }
            
            /* Кнопка "Сохранить" на новой строке */
            .device-name {
                width: 100%;
                margin-bottom: 10px;
                order: 1;
            }
            .save-component-btn {
                order: 2;
                flex-grow: 1;
            }
            .delete-btn {
                order: 3;
            }

            .device-content {
              flex-direction: column;
              gap: 20px;
            }
            
            .device-image {
              align-self: center;
              flex: 0 0 150px; 
              height: 150px;
            }
            
            .input-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }
            
            .input-row .input-field {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default BidPage;