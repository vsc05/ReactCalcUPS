// src/BidDetailsPage.tsx

import { type FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// ... (остальные импорты)
import { Spinner } from "react-bootstrap";
import { AppHeader } from "./AppHeader";
import { useAppSelector } from "./hooks/redux"; 
import defaultImage from "./DefaultImage.png"; 

// Интерфейсы, скопированные из BidPage, но дополненные для отображения
interface BidComponent {
  id: number;                   // ID записи CalcUPS
  component_id: number;         // ID самого компонента
  title: string;
  image: string;
  coeff: number;
  power: number;
  count: number; 
  battery_life: number;         // Время работы (исходное значение)
  calculated_power: number;     // Рассчитанная мощность
}

interface BidDetails {
  id: number;
  incoming_current: number;     // Общее время работы (Входящие токи)
  calculated_power_count: number; // Итоговая рассчитанная мощность ИБП
  status: string;
  components: BidComponent[];
}

// Вспомогательный компонент для отображения сообщений
const NotificationMessage: FC<{ type: 'error' | 'success', message: string }> = ({ type, message }) => (
    <div className={type === 'error' ? 'error-message' : 'success-message'}>
        {message}
    </div>
);


export const BidDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { isAuthenticated, token } = useAppSelector((state) => state.user);
  
  const [bidDetails, setBidDetails] = useState<BidDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); 
  
  // 1. Проверяем авторизацию и редирект
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: `/biddetails/${id}` } });
    }
  }, [isAuthenticated, token, navigate, id]);

  // 2. Загружаем детали заявки
  useEffect(() => {
    if (isAuthenticated && token && id) {
      loadBidDetails();
    }
  }, [id, isAuthenticated, token]);

  const loadBidDetails = async () => {
    if (!token || !id) return;
    setErrorMessage(null); 
    
    try {
      setLoading(true);
      
      // Запрос к API, как в BidPage, но для режима просмотра
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
        console.log('--- Bid Details Loaded (View Mode) ---');
        
        // 1. Создаем массив компонентов и сразу инициализируем сумму
        let totalCalculatedPower = 0; // ⭐️ Инициализация суммы ⭐️
        
        const components: BidComponent[] = (data.data.components || []).map((comp: any) => {
             const calculatedPower = comp.calculated_power || 0;
             
             // ⭐️ Суммирование рассчитанной мощности ⭐️
             totalCalculatedPower += calculatedPower; 

             return {
                 id: comp.id, 
                 component_id: comp.component_id, 
                 title: comp.title,
                 image: comp.image,
                 coeff: comp.coeff,
                 power: comp.power,
                 count: comp.count || 1,
                 battery_life: comp.battery_life || 0,
                 calculated_power: calculatedPower,
             };
        });
          
        setBidDetails({
          id: data.data.id || parseInt(id),
          incoming_current: data.data.incoming_current || data.data.hours || 0, // Общее время работы
          calculated_power_count: totalCalculatedPower, // ⭐️ Используем рассчитанную сумму ⭐️
          status: data.data.status || 'неизвестен',
          components: components
        });
        
        // Дополнительная проверка: если статус "черновик" -> редирект на редактирование
        if (data.data.status === 'черновик') {
            navigate(`/bidups/${id}`);
        }
      }
    } catch (error: any) {
      console.error('Ошибка загрузки деталей заявки:', error);
      setErrorMessage(`Не удалось загрузить заявку: ${error.message || 'ошибка сети'}`);
      
    } finally {
      setLoading(false);
    }
  };

  // ⭐️ Вспомогательная функция для отображения мощности ⭐️
  const formatPower = (power: number | undefined): string => {
      const p = power || 0;
      return p > 0 ? `${p} Вт` : 'Не рассчитано';
  };

  // ⭐️ НОВАЯ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ВРЕМЕНИ РАБОТЫ ⭐️
  const formatBatteryLife = (hours: number | undefined): string => {
      const h = hours || 0;
      return h > 0 ? `${h} ч` : 'Не задано';
  };


  if (loading) {
    return (
      <div className="bid-page-wrapper">
        <AppHeader />
        <div className="main-container">
          <div className="loadingBg" style={{ textAlign: 'center', padding: '50px' }}>
            <Spinner animation="border" variant="primary" />
            <div style={{ marginTop: '10px', color: '#2CAEFF' }}>
                Загружаем детали заявки...
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (errorMessage) {
    return (
      <div className="bid-page-wrapper">
        <AppHeader />
        <div className="main-container">
          <NotificationMessage type="error" message={errorMessage} />
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
            <h2 className="page-title">Просмотр заявки №{bidDetails?.id}</h2>
            
            {/* Статус заявки */}
            <div className="header-controls">
                <span className="input-label">Статус:</span>
                <span className="stat-value" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {bidDetails?.status || '—'}
                </span>
            </div>
          </div>

          {/* Общее время работы */}
          <div className="input-group-static">
            <span className="input-label">Входящие токи (общ.), Вт:</span>
            <span className="input-value-static">
                {bidDetails?.incoming_current || 0}
            </span>
          </div>

          {/* Итоговый рассчитанный результат */}
          <div className="result-message" style={{ marginTop: '20px' }}>
            Рассчитанная мощность ИБП: {formatPower(bidDetails?.calculated_power_count)}
          </div>
        </div>

        <div className="components-list">
          {(!bidDetails || bidDetails.components.length === 0) && (
            <div className="empty-message">В заявке нет компонентов.</div>
          )}
          {bidDetails?.components.map((component) => (
              <div key={component.id} className="device-card">
                <div className="device-header">
                  <h3 className="device-name">{component.title}</h3>
                  
                  {/* Нет кнопок "Сохранить" и "Удалить" */}
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
                    
                    {/* ПОЛЕ: Количество */}
                    <div className="input-row-static">
                      <span className="input-label">Количество:</span>
                      <span className="input-value-static">
                        {component.count}
                      </span>
                    </div>
                    
                    {/* ПОЛЕ: Время работы, ч (BatteryLife) */}
                    <div className="input-row-static">
                      <span className="input-label">Время работы, ч</span>
                      <span className="input-value-static">
                        {/* ⭐️ ИСПОЛЬЗУЕМ НОВЫЙ ФОРМАТОР ⭐️ */}
                        {formatBatteryLife(component.battery_life)}
                      </span>
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
                      <div className="stat-item" style={{ borderTop: '1px dashed #ccc', marginTop: '5px', paddingTop: '5px' }}>
                        <span className="stat-label" style={{ fontWeight: 'bold' }}>Рассчитанная мощность:</span>
                        <span className="stat-value" style={{ fontWeight: 'bold' }}>
                            {formatPower(component.calculated_power)} 
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <style>
        {`
          /* === ОБЩИЕ СТИЛИ КОПИРОВАНЫ ИЗ BidPage.tsx === */
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
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
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
            gap: 10px;
            flex-wrap: wrap;
          }

          .input-label {
            color: #2CAEFF;
            font-size: 16px;
            font-weight: bold;
            white-space: nowrap;
          }

          /* --- СТИЛИ ДЛЯ СТАТИЧЕСКИХ ПОЛЕЙ (ВМЕСТО input-group) --- */
          .input-group-static {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 10px;
          }
          
          .input-value-static {
            font-size: 16px;
            font-weight: bold;
            color: #444;
            background-color: #f0f9ff;
            border: 1px solid #2CAEFF;
            border-radius: 5px;
            padding: 8px 12px;
            min-width: 120px;
            text-align: center;
          }
          /* --- КОНЕЦ СТИЛЕЙ ДЛЯ СТАТИЧЕСКИХ ПОЛЕЙ --- */


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
            text-align: center;
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
            padding: 15px; /* Увеличено для лучшего вида */
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .device-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px; 
            padding-bottom: 5px; 
            border-bottom: 2px solid #f0f0f0;
          }
          
          .device-name {
            color: #2CAEFF;
            font-size: 22px;
            font-weight: bold;
            margin: 0;
            flex-grow: 1; 
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
          
          /* --- СТИЛИ ДЛЯ СТАТИЧЕСКИХ СТРОК КОМПОНЕНТА --- */
          .input-row-static {
            display: flex;
            align-items: center;
            gap: 15px; 
            margin-bottom: 8px; 
            padding: 3px 0; 
            justify-content: space-between; 
          }
          /* --- КОНЕЦ СТИЛЕЙ СТАТИЧЕСКИХ СТРОК КОМПОНЕНТА --- */

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
              justify-content: space-between;
            }

            .input-group-static {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
            
            .input-value-static {
                width: 100%;
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
            
            .input-row-static {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }
            
            .input-row-static .input-value-static {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default BidDetailsPage;