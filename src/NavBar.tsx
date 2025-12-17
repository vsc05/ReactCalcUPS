// src/NavBar.tsx
import type { FC } from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { logoutUserAsync } from './slices/userSlice';
import "./components/NavigationMenu.css";

export const NavBar: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated, username } = useSelector((state: RootState) => state.user);
  const cart = useSelector((state: RootState) => state.cart);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserAsync()).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      navigate('/');
    }
  };

  return (
    <Navbar expand="lg" collapseOnSelect className="custom-navbar" style={{ backgroundColor: 'white' }}>
      <Container>
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="navbar-toggler-custom"
        />
        <Navbar.Collapse id="basic-navbar-nav" className="navbar-collapse-custom">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="nav-link-custom">
              Домой
            </Nav.Link>
            <Nav.Link as={Link} to="/components" className="nav-link-custom">
              Компоненты
            </Nav.Link>
            {/* ⭐️ НОВАЯ ССЫЛКА НА СПИСОК ЗАЯВОК ⭐️ */}
            {isAuthenticated && (
              <Nav.Link as={Link} to="/my-bidsups" className="nav-link-custom">
                Мои заявки
              </Nav.Link>
            )}
          </Nav>
          
          <Nav className="ms-auto align-items-center">
            {isAuthenticated ? (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/profile" 
                  className="me-3 user-profile-link"
                  style={{ 
                    color: '#2CAEFF',
                    fontWeight: 'bold',
                    padding: '8px 15px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(44, 174, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    border: '2px solid #2CAEFF',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '120px',
                    height: '40px'
                  }}
                  title="Перейти в личный кабинет"
                >
                  <span style={{ 
                    color: 'white',
                    display: 'inline-block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100px'
                  }}>
                    {username ? username : 'Пользователь'}
                  </span>
                </Nav.Link>
                {cart.bid_id && (
                  <Nav.Link as={Link} to={`/bidups/${cart.bid_id}`} className="me-3">
                    <Button variant="outline-info" size="sm">
                      Корзина ({cart.count_items || 0})
                    </Button>
                  </Nav.Link>
                )}
                <Button 
                  variant="outline-danger" 
                  onClick={handleLogout}
                  size="sm"
                  style={{ height: '40px' }}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2">
                  <Button variant="outline-primary" size="sm">
                    Войти
                  </Button>
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  <Button variant="success" size="sm">
                    Регистрация
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
      
      <style>
        {`
          .user-profile-link:hover {
            background-color: rgba(203, 217, 229, 0.2) !important;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(234, 246, 253, 0.2);
          }
          
          .navbar-collapse-custom {
            justify-content: space-between;
          }
          
          .nav-link-custom {
            color: #ffffffff !important;
            font-weight: bold;
            padding: 8px 15px !important;
            margin: 0 5px;
            border-radius: 5px;
            transition: all 0.3s ease;
          }
          
          .nav-link-custom:hover {
            background-color: rgba(223, 201, 201, 0.1) !important;
            color: #c5d9e5ff !important;
          }
          
          .custom-navbar {
            background-color: #2CAEFF !important;
            padding: 10px 0;
          }
          
          .navbar-toggler-custom {
            border-color: #2CAEFF;
          }
          
          .navbar-toggler-custom:focus {
            box-shadow: 0 0 0 0.2rem rgba(44, 174, 255, 0.25);
          }
          
          .navbar-toggler-custom .navbar-toggler-icon {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2844, 174, 255, 1%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
          }
        `}
      </style>
    </Navbar>
  );
};