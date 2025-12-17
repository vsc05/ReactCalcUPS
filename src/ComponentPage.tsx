import "./components/ComponentPage.css"; 
import { type FC, useEffect, useState } from "react";
import { BreadCrumbs } from "./BreadCrumbs";
import { useParams } from "react-router-dom";
import { type Component, getComponentById } from "./modules/componentApi";
import { Spinner, Image } from "react-bootstrap";
import defaultImage from "./DefaultImage.png";
import { COMPONENTS_MOCK } from "./modules/mock";
import { AppHeader } from "./AppHeader";

export const ComponentPage: FC = () => {
  const [pageData, setPageData] = useState<Component>();
  const [loading, setLoading] = useState(true);

  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    
    getComponentById(id)
      .then((response) => setPageData(response.component))
      .catch(() => {
        const mockComponent = COMPONENTS_MOCK.find(
          (component) => String(component.id) === id
        );
        setPageData(mockComponent);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="component-page-main-wrapper"> 
      <AppHeader /> 
      <div className="component-breadcrumbs-wrapper">
          <BreadCrumbs
            crumbs={[
              { label: "Компоненты", path: "/components" },
              { label: pageData?.title || "Компонент" },
            ]}
          />
      </div>
      
      {loading ? (
        <div className="component-page-loader-block">
          <Spinner animation="border" />
        </div>
      ) : pageData ? (
        <main className="device-details">
          <h2 className="device-title">{pageData.title}</h2>
          
          <div className="device-content">
            <div className="device-image">
              <Image
                src={pageData.image || defaultImage}
                alt={pageData.title}
              />
            </div>
            
            <div className="device-info">
              
              <div className="device-specs">
                <p>
                  Мощность ~<strong>{pageData.power || 'Н/Д'}</strong> Вт
                </p>
                <p>
                  Коэффициент мощности ~<strong>{pageData.coeff || 'Н/Д'}</strong>
                </p>
                <p style={{ fontSize: '18px' }}>
                  Статус: <strong>{pageData.is_delete ? "Удален" : "Активен"}</strong>
                </p>
              </div>
              
              <div className="device-note">
                <p>Коэффициент мощности производители указывают в инструкции к устройству. Если данная величина не указана в технической документации, можно воспользоваться средними значениями.</p>
              </div>
            </div>
          </div>
        </main>
      ) : null}
    </div>
  );
};
