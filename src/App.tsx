import { BrowserRouter, Route, Routes } from "react-router-dom";
// import { AlbumPage } from "./AlbumPage";
import MainPage from "./MainPage";
import { ROUTES } from "../Routes";
import HomePage from "./HomePage";
import { ComponentPage } from "./ComponentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} index element={<HomePage />} />
        <Route path={ROUTES.COMPONENTS} element={<MainPage />} />
        <Route path={`${ROUTES.COMPONENTS}/:id`} element={<ComponentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;