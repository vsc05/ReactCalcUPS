import type { FC } from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom';
import "./components/NavigationMenu.css";

export const NavigationMenu: FC = () => {
  return (
    <Navbar expand="lg" collapseOnSelect>
      <Container>
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="navbar-toggler-custom"
        />
        <Navbar.Collapse id="basic-navbar-nav" className="navbar-collapse-custom">
          <Nav className="ms-auto nav-links-custom">
            <Nav.Link as={Link} to="/" className="nav-link-custom">
              Домой
            </Nav.Link>
            <Nav.Link as={Link} to="/components" className="nav-link-custom">
              Компоненты
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};