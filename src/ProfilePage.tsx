import { type FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "./AppHeader";
// 🔑 Импорт useAppDispatch обязателен, так как ты используешь dispatch
import { useAppSelector, useAppDispatch } from "./hooks/redux"; 
// 🔑 Импорт updateUserProfileAsync обязателен
import { updateUserProfileAsync } from "./slices/userSlice"; 

export const ProfilePage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // Инициализация dispatch

  // 🔑 Используем userId, как указано в твоем правильном коде
  const { isAuthenticated, username, userId, loading: userLoading, error: userError } = useAppSelector((state) => state.user);
  
  console.log('🔍 ProfilePage debug:', {
    isAuthenticated,
    username,
    userId, // Теперь это должно быть число
  });
  
  const [newUsername, setNewUsername] = useState(username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Редирект если не авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🚫 Not authenticated, redirecting to login');
      navigate('/login');
    } else {
      console.log('✅ User is authenticated:', { username, userId });
    }
  }, [isAuthenticated, navigate]);

  // Обновляем имя пользователя при загрузке или после успешной смены логина в Redux
  useEffect(() => {
    if (username) {
      setNewUsername(username);
      console.log('📝 Setting newUsername to:', username);
    }
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Submitting profile update...');
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Проверки
      if (newPassword && newPassword !== confirmPassword) {
        throw new Error('Новые пароли не совпадают');
      }

      // 🔑 Проверка наличия ID
      if (!userId) {
        throw new Error('Данные пользователя не найдены. Перезайдите в систему.');
      }

      // Всегда требуем текущий пароль для подтверждения
      if (!currentPassword) {
        throw new Error('Введите текущий пароль для подтверждения');
      }

      // 2. Подготовка данных для thunk
      const updatePayload: {
        userId: number;
        login?: string;
        newPassword?: string;
        currentPassword: string;
      } = {
        userId: userId,
        currentPassword: currentPassword, // Старый пароль для подтверждения
      };
      
      // Если логин изменился
      if (newUsername && newUsername !== username) {
        updatePayload.login = newUsername;
      }
      
      // Если введен новый пароль
      if (newPassword) {
        updatePayload.newPassword = newPassword;
      }
      
      // Если не меняется ни логин, ни пароль, отменяем отправку
      if (!updatePayload.login && !updatePayload.newPassword) {
         setLoading(false);
         setSuccess('Изменений нет');
         return;
      }

      console.log('📤 Dispatching update request:', {
        userId,
        login: updatePayload.login || username,
        hasNewPassword: !!updatePayload.newPassword
      });

      // 3. Вызов асинхронного действия
      const resultAction = await dispatch(updateUserProfileAsync(updatePayload));
      
      // 4. Обработка результата
      if (updateUserProfileAsync.rejected.match(resultAction)) {
        throw new Error(resultAction.payload as string || 'Не удалось обновить данные пользователя');
      }

      // 5. Успешное выполнение
      setSuccess((resultAction.payload as any).message || 'Данные успешно обновлены');
      
      // Очищаем поля паролей
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('❌ Ошибка обновления профиля:', error);
      setError(error.message || 'Не удалось обновить данные');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-wrapper">
      <AppHeader />
      
      <div className="main-container">
        <div className="profile-content">
          <h1 className="page-title">Личный кабинет</h1>
          
          <div className="profile-card">
            {error && (
              <div className="error-message">
                <div className="error-icon">!</div>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <div className="success-icon">✓</div>
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="section-title">Личные данные</h3>
                
                <div className="input-group">
                  <label className="input-label">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Введите новое имя пользователя"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={loading}
                  />
                  <div className="input-hint">
                    Текущее имя: <strong style={{ color: '#2CAEFF' }}>{username}</strong>
                    {userId && <span style={{ marginLeft: '10px', color: '#666' }}>ID: {userId}</span>}
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3 className="section-title">Смена пароля</h3>
                
                <div className="input-group">
                  <label className="input-label">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Введите текущий пароль"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <div className="input-hint">
                    Требуется для подтверждения изменений
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Введите новый пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                  <div className="input-hint">
                    Оставьте пустым, если не хотите менять пароль
                  </div>
                </div>
                
                {newPassword && (
                  <div className="input-group">
                    <label className="input-label">
                      Подтверждение пароля
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Повторите новый пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button"
                  className="back-btn"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Назад
                </button>
                
                <button 
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* 💅 Стили CSS, вставленные в тег style */}
      <style jsx ="true">
        {`
          /* Сброс и Базовая типографика */
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              /* ⚠️ Убедитесь, что шрифты "ALS Sector..." установлены глобально */
              font-family: Arial, sans-serif; 
          }

          .profile-page-wrapper {
              background-color: #f5f9ff;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
          }

          /* --- Контейнеры --- */

          .main-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              width: 100%;
          }

          .page-title {
              color: #2CAEFF; 
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 40px;
              text-align: center;
          }

          .profile-card {
              background-color: white;
              border-radius: 15px;
              padding: 40px;
              box-shadow: 0 5px 25px rgba(0, 0, 0, 0.05);
          }

          /* --- Секции и заголовки --- */

          .form-section {
              margin-bottom: 40px;
              padding-bottom: 30px;
              border-bottom: 1px solid #e0e0e0;
          }

          .form-section:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
          }

          .section-title {
              color: #2CAEFF;
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 25px;
          }

          /* --- Поля ввода --- */

          .input-group {
              margin-bottom: 25px;
          }

          .input-label {
              display: block;
              color: #333;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
          }

          .input-field {
              width: 100%;
              border: 1px solid #ccc;
              border-radius: 8px;
              padding: 12px 15px;
              font-size: 16px;
              color: #f7f3f3ff;
              transition: all 0.3s ease;
              box-sizing: border-box;
          }

          .input-field:focus {
              outline: none;
              border-color: #2CAEFF;
              box-shadow: 0 0 0 3px rgba(44, 174, 255, 0.2);
          }

          .input-field:disabled {
              background-color: #f8f9fa;
              border-color: #dee2e6;
              color: #6c757d;
              cursor: not-allowed;
          }

          .input-hint {
              color: #6c757d;
              font-size: 14px;
              margin-top: 8px;
          }

          /* --- Сообщения --- */

          .error-message, .success-message {
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 30px;
              font-weight: 500;
              display: flex;
              align-items: center;
          }

          .error-message {
              background-color: #ffeaea;
              border: 1px solid #ff4757;
              color: #d8000c;
          }

          .error-icon {
              font-weight: bold;
              margin-right: 12px;
          }

          .success-message {
              background-color: #e6ffe6;
              border: 1px solid #2ed573;
              color: #007200;
          }

          .success-icon {
              font-weight: bold;
              margin-right: 12px;
          }

          /* --- Действия (Кнопки) --- */

          .form-actions {
              display: flex;
              justify-content: flex-end;
              margin-top: 40px;
              gap: 20px;
          }

          .back-btn, .save-btn {
              border: none;
              border-radius: 8px;
              padding: 14px 30px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.3s ease;
              min-width: 150px;
          }

          .back-btn {
              background-color: #6c757d;
              color: white;
          }

          .back-btn:hover:not(:disabled) {
              background-color: #5a6268;
          }

          .save-btn {
              background-color: #2CAEFF;
              color: white;
          }

          .save-btn:hover:not(:disabled) {
              background-color: #1e9de5;
          }

          .back-btn:disabled, .save-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
          }

          /* --- Адаптивность --- */
          @media (max-width: 768px) {
              .main-container {
                  padding: 20px 15px;
              }
              
              .profile-card {
                  padding: 25px;
              }
              
              .page-title {
                  font-size: 28px;
                  margin-bottom: 30px;
              }
              
              .form-actions {
                  flex-direction: column;
              }
              
              .back-btn, .save-btn {
                  width: 100%;
                  min-width: unset;
              }
          }
        `}
      </style>
    </div>
  );
};

export default ProfilePage;