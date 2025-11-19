import type { FC } from "react";
import { Carousel, Col, Container, Row } from "react-bootstrap";
import { AppHeader } from "./AppHeader"
import "./components/HomePage.css"; 
import heroImage from "./components/Rectangle1.png"; 
// Добавьте импорт дополнительных изображений для карусели
import image2 from "./components/Rectangle2.png"; // Замените на ваши изображения
import image3 from "./components/Rectangle3.png"; // Замените на ваши изображения

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
            {/* Заменяем статичное изображение на карусель */}
            <Carousel fade indicators={false} controls={true} interval={3000}>
              <Carousel.Item>
                <img
                  className="d-block w-100 carousel-image"
                  src={heroImage}
                  alt="Первое изображение ИБП"
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  className="d-block w-100 carousel-image"
                  src={image2}
                  alt="Второе изображение ИБП"
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  className="d-block w-100 carousel-image"
                  src={image3}
                  alt="Третье изображение ИБП"
                />
              </Carousel.Item>
            </Carousel>
          </Col>
        </Row>

        {/* Убрана секция с кнопками */}
      </Container>
    </div>
  );
};

export default HomePage;