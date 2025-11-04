import type { FC } from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';


export const NavigationMenu: FC = () => {
  return (
    // Убираем bg="light" и expand="lg", чтобы стилизировать его в AppHeader
    <Navbar expand="lg"> 
      <Container>
        {/* Убрал Navbar.Brand, так как AppHeader уже содержит заголовок */}
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* ms-auto: Сдвигает ссылки вправо (аналог me-auto в старых версиях) */}
          <Nav className="ms-auto"> 
            <Nav.Link href="/">Домой</Nav.Link>
            <Nav.Link href="/components">Компоненты</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
