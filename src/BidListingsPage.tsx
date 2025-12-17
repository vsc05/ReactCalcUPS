// src/BidListingsPage.tsx

import type { FC } from "react";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Container, Card, Spinner, Alert, Form, Button, Row, Col, Badge } from "react-bootstrap";
import { format } from "date-fns"; 
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom"; 

import { AppHeader } from './AppHeader'; 
import { BreadCrumbs } from './BreadCrumbs'; 

import type { RootState, AppDispatch } from "./store";
import { fetchUserBids, type Bid, updateBidStatusAsync } from "./slices/bidsSlice";

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "черновик", label: "Черновик" },
  { value: "сформирован", label: "Сформирован" },
  { value: "рассчитан", label: "Рассчитан" },
  { value: "завершена", label: "Завершена" }, 
  { value: "удален", label: "Удален" },
  { value: "отклонена", label: "Отклонена" }, 
];

const POLLING_INTERVAL_MS = 1000; 

export const BidListingsPage: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { items: bids, error } = useSelector((state: RootState) => state.bids); 
  const { username, isModerator, userId } = useSelector((state: RootState) => state.user);
  
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [creatorFilter, setCreatorFilter] = useState<string>(""); 
  
  const [processingBidId, setProcessingBidId] = useState<number | null>(null);

  const crumbs = [{ label: isModerator ? "Все заявки" : "Мои заявки" }];

  useEffect(() => {
    let intervalId: number | null = null;
    const loadBids = () => {
        if (!username) return;
        const userParam = !isModerator ? username : (creatorFilter || undefined);
        dispatch(fetchUserBids({ username: userParam, status: statusFilter, start_date: startDate, end_date: endDate } as any)); 
    };
    loadBids();
    if (username) {
        intervalId = window.setInterval(loadBids, POLLING_INTERVAL_MS); 
    }
    return () => { if (intervalId !== null) clearInterval(intervalId); }
  }, [dispatch, username, isModerator, statusFilter, startDate, endDate, creatorFilter]); 

  const handleResetFilters = () => {
    setStartDate(today); setEndDate(today); setStatusFilter(""); setCreatorFilter(""); 
  };

  const handleCardClick = (bid: Bid) => {
    const currentStatus = (bid.status || '').toLowerCase();
    if (currentStatus === "черновик" && !isModerator) {
      navigate(`/bidups/${bid.id}`);
    } else {
      navigate(`/biddetailsups/${bid.id}`);
    }
  };

  const handleStatusUpdate = async (e: React.MouseEvent, bidId: number, newStatus: 'завершена' | 'отклонена') => {
    e.stopPropagation();
    if (!isModerator || !userId) return;
    setProcessingBidId(bidId);
    try {
      await dispatch(updateBidStatusAsync({ bidId, newStatus, moderatorId: userId })).unwrap();
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
    } finally {
      setProcessingBidId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s === "черновик" || s === "сформирован") return "info";
    if (s === "рассчитан") return "warning";
    if (s === "завершена") return "success";
    if (s === "удален" || s === "отклонена") return "danger";
    return "secondary";
  };

  if (!username) {
    return (
      <>
        <AppHeader /> 
        <Container className="my-5"><Alert variant="warning">Необходимо войти в систему.</Alert></Container>
      </>
    );
  }

  return (
    <div className="bid-listings-page-wrapper">
      <AppHeader /> 
      <Container className="pb-5">
        <BreadCrumbs crumbs={crumbs} />
        <h2 className="mb-4">📋 {isModerator ? `Все заявки` : `Мои заявки`}</h2>
        
        {/* Фильтры */}
        <Card className="mb-4 border-0 shadow-sm bg-white">
          <Card.Body>
            <Form>
              <Row className="g-3 align-items-end">
                {isModerator && (
                  <Col md={3}>
                    <Form.Label className="small fw-bold">Логин создателя</Form.Label>
                    <Form.Control size="sm" type="text" value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} />
                  </Col>
                )}
                <Col md={isModerator ? 3 : 4}>
                  <Form.Label className="small fw-bold">Дата начала</Form.Label>
                  <Form.Control size="sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Col>
                <Col md={isModerator ? 3 : 4}>
                  <Form.Label className="small fw-bold">Дата окончания</Form.Label>
                  <Form.Control size="sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Col>
                <Col md={isModerator ? 3 : 4}>
                  <Form.Label className="small fw-bold">Статус</Form.Label>
                  <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Form.Select>
                </Col>
                <Col md="auto">
                  <Button variant="link" className="text-decoration-none p-0 small" onClick={handleResetFilters}>Сбросить</Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Список карточек в 1 столбец */}
        <div className="d-flex flex-column gap-3">
          {bids.map((bid) => {
            const isProcessing = processingBidId === bid.id;
            const canModUpdate = isModerator && bid.status.toLowerCase() === "сформирован";

            return (
              <Card 
                key={bid.id}
                className="bid-card shadow-sm border-0 w-100" 
                onClick={() => handleCardClick(bid)}
              >
                <Card.Body>
                  <Row className="align-items-center">
                    {/* Левая часть: ID и Статус */}
                    <Col xs={12} md={2} className="mb-3 mb-md-0">
                      <div className="fw-bold text-primary mb-1"># {bid.id}</div>
                      <Badge bg={getStatusVariant(bid.status)}>{bid.status}</Badge>
                    </Col>

                    {/* Средняя часть: Инфо о создании */}
                    <Col xs={12} md={4} className="mb-3 mb-md-0 border-start-md ps-md-4">
                      {isModerator && <div className="small text-muted">Создатель: <span className="text-dark fw-medium">{bid.creator_login}</span></div>}
                      <div className="small text-muted">Создана: {format(new Date(bid.date_update), "dd.MM.yyyy HH:mm")}</div>
                      {bid.date_finish && bid.date_finish !== "0001-01-01T00:00:00Z" && (
                        <div className="small text-success">Завершена: {format(new Date(bid.date_finish), "dd.MM.yyyy HH:mm")}</div>
                      )}
                    </Col>

                    {/* Правая часть: Показатели */}
                    <Col xs={6} md={2} className="text-center">
                      <div className="small text-muted" style={{ fontSize: '0.7rem' }}>ТОК (Вт)</div>
                      <div className="fw-bold fs-5">{bid.incoming_current || 0}</div>
                    </Col>
                    <Col xs={6} md={2} className="text-center">
                      <div className="small text-muted" style={{ fontSize: '0.7rem' }}>РЕЗУЛЬТАТОВ</div>
                      <div className="fw-bold fs-5">{bid.calculated_power_count || 0}</div>
                    </Col>

                    {/* Кнопки действий для модератора */}
                    <Col xs={12} md={2} className="mt-3 mt-md-0 text-md-end">
                      {canModUpdate ? (
                        <div className="d-flex flex-md-column gap-2" onClick={e => e.stopPropagation()}>
                          <Button 
                            variant="success" 
                            size="sm"
                            disabled={isProcessing}
                            onClick={(e) => handleStatusUpdate(e, bid.id, 'завершена')}
                          >
                            {isProcessing ? <Spinner size="sm" /> : 'Завершить'}
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            disabled={isProcessing}
                            onClick={(e) => handleStatusUpdate(e, bid.id, 'отклонена')}
                          >
                            Отклонить
                          </Button>
                        </div>
                      ) : (
                        <div className="text-muted small d-none d-md-block">Детали →</div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            );
          })}
        </div>

        {!error && bids.length === 0 && (
          <div className="text-center py-5 text-muted">Заявки не найдены</div>
        )}
      </Container>

      <style>{`
        .bid-listings-page-wrapper { background-color: #f4f7f6; min-height: 100vh; }
        .bid-card { 
          transition: transform 0.2s, box-shadow 0.2s; 
          cursor: pointer; 
          border-radius: 10px;
          max-width: 100%;
        }
        .card { 
          transition: transform 0.2s, box-shadow 0.2s; 
          cursor: pointer; 
          border-radius: 10px;
          max-width: 100%;
        }
        .bid-card:hover { 
          transform: scale(1.005); 
          box-shadow: 0 5px 15px rgba(0,0,0,0.08) !important; 
        }
        @media (min-width: 768px) {
          .border-start-md { border-left: 1px solid #dee2e6; }
        }
        .badge { font-weight: 500; padding: 0.5em 0.8em; }
      `}</style>
    </div>
  );
};

export default BidListingsPage;