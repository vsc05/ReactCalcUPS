export const ROUTES = {
  HOME: "/",
  COMPONENTS: "/components",
}
export type RouteKeyType = keyof typeof ROUTES;
export const ROUTE_LABELS: {[key in RouteKeyType]: string} = {
  HOME: "Главная",
  COMPONENTS: "Компоненты",
};