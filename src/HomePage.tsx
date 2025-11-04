import type { FC } from "react";
import { Link } from "react-router-dom";
import { Button, Col, Container, Row } from "react-bootstrap";
import { AppHeader } from "./AppHeader"
import "./components/HomePage.css"; 
import heroImage from "./components/Rectangle1.png"; 

const ROUTES = {
  DEVICES: "/components",
  REQUESTS: "/bidups",
};

export const HomePage: FC = () => {
  return (
    <div className="page-wrapper">
      <AppHeader /> 

      <Container className="content-container">
        <Row className="hero-banner">
          <Col xs={12} md={7} className="hero-text-col">
            <h1>Вычисление мощности ИБП</h1>
            <p>
              Цель работы - предоставить возможность посетителям сайта рассчитать
              необходимую мощность ИБП для небольшого офиса.
            </p>
          </Col>

          <Col xs={12} md={5} className="hero-image-col">
            <img src={heroImage} alt="Компьютерные аксессуары" />
          </Col>
        </Row>

        <Row className="text-center mt-4">
          <Col className="d-flex justify-content-center hero-buttons-container"> 
            <Link to={ROUTES.DEVICES} className="d-inline-block">
              <Button variant="primary" className="hero-button">
                Устройства
              </Button>
            </Link>
            <Link to={ROUTES.REQUESTS} className="d-inline-block">
              <Button variant="primary" className="hero-button">
                Заявки
              </Button>
            </Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;