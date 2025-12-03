// src/RegisterPage.tsx
import React, { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { registerUserAsync, clearError } from './slices/userSlice';
import { useNavigate, Link } from "react-router-dom";
import './components/index.css';

const RegisterPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ 
    login: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [validationError, setValidationError] = useState('');
  
  const { error, loading } = useSelector((state: RootState) => state.user);

  // Очищаем ошибку при размонтировании
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Пароли не совпадают');
      return;
    }
    
    if (formData.password.length < 6) {
      setValidationError('Пароль должен быть не менее 6 символов');
      return;
    }
    
    if (formData.login && formData.password) {
      const result = await dispatch(registerUserAsync({
        login: formData.login,
        password: formData.password
      }));
      
      // Если регистрация успешна, переходим на страницу входа
      if (registerUserAsync.fulfilled.match(result)) {
        navigate('/login');
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px', padding: '20px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Регистрация</Card.Title>
          
          {(error || validationError) && (
            <Alert variant="danger">{error || validationError}</Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="login" className="mb-3">
              <Form.Label>Логин</Form.Label>
              <Form.Control
                type="text"
                name="login"
                value={formData.login}
                onChange={handleChange}
                placeholder="Введите логин"
                required
              />
            </Form.Group>
            
            <Form.Group controlId="password" className="mb-3">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите пароль"
                required
              />
            </Form.Group>
            
            <Form.Group controlId="confirmPassword" className="mb-4">
              <Form.Label>Подтверждение пароля</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите пароль"
                required
              />
            </Form.Group>
            
            <Button 
              variant="success" 
              type="submit" 
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            
            <div className="text-center">
              <Link to="/login">Уже есть аккаунт? Войти</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RegisterPage;