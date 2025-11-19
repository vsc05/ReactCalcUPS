// componentApi.ts
import { API_BASE_URL } from './apiConfig';

export interface Component {
  id: number;
  image: string;
  title: string;
  power: number;
  coeff: number;
  is_delete: boolean;
}

export interface ComponentsResponse {
  data: {
    Components: Component[];
  };
}

export interface ComponentResponse {
  component: Component;
}

export const getComponentsByTitle = async (title = ""): Promise<ComponentsResponse> => {
  return fetch(`${API_BASE_URL}/component?query=${title}`)
    .then(response => response.json());
};

export const getComponentById = async (id: number | string): Promise<ComponentResponse> => {
  return fetch(`${API_BASE_URL}/component/${id}`)
    .then(response => response.json());
};

export const getCartIcon = async (): Promise<ComponentResponse> => {
  return fetch(`${API_BASE_URL}/UPSbid`)
    .then(response => response.json());
};