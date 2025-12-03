/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface DsComponent {
  coeff?: number;
  id?: number;
  image?: string;
  is_delete?: boolean;
  power?: number;
  title?: string;
}

export interface DsLoginRequest {
  login?: string;
  password?: string;
}

export interface DsLoginResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: any;
}

export interface DsRegisterRequest {
  isModerator?: boolean;
  login: string;
  password: string;
}

export interface DsUpdateUserRequest {
  isModerator?: boolean;
  login?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title UPS calc
 * @version 1.0
 * @license AS IS (NO WARRANTY)
 * @contact API Support <bitop@spatecon.ru> (https://vk.com/bmstu_schedule)
 *
 * API SERVER
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * @description Возвращает данные корзины (ID бида и количество товаров) для текущего авторизованного пользователя
     *
     * @tags bidUPS
     * @name BidUpsList
     * @summary Получить корзину пользователя
     * @request GET:/api/bidUPS
     * @secure
     */
    bidUpsList: (params: RequestParams = {}) =>
      this.request<Record<string, any>, Record<string, any>>({
        path: `/api/bidUPS`,
        method: "GET",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Возвращает детальную информацию о заявке UPS по указанному ID, включая компоненты
     *
     * @tags bidUPS
     * @name BidUpsDetail
     * @summary Получить заявку UPS по ID
     * @request GET:/api/bidUPS/{id}
     */
    bidUpsDetail: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, any>, Record<string, any>>({
        path: `/api/bidUPS/${id}`,
        method: "GET",
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Полностью удаляет заявку на расчет ИБП
     *
     * @tags bidUPS
     * @name BidUpsDelete
     * @summary Удалить заявку ИБП
     * @request DELETE:/api/bidUPS/{id}
     */
    bidUpsDelete: (id: number, request: object, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/bidUPS/${id}`,
        method: "DELETE",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Отклоняет заявку на расчет ИБП с указанием модератора и статуса
     *
     * @tags bidUPS
     * @name BidUpsDeclineUpdate
     * @summary Отклонить заявку ИБП
     * @request PUT:/api/bidUPS/{id}/decline
     */
    bidUpsDeclineUpdate: (
      id: number,
      request: object,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/bidUPS/${id}/decline`,
        method: "PUT",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Завершает формирование заявки на расчет ИБП
     *
     * @tags bidUPS
     * @name BidUpsFormUpdate
     * @summary Сформировать заявку ИБП
     * @request PUT:/api/bidUPS/{id}/form
     */
    bidUpsFormUpdate: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/bidUPS/${id}/form`,
        method: "PUT",
        format: "json",
        ...params,
      }),

    /**
     * @description Обновляет вес и производительность для заявки ИБП
     *
     * @tags bidUPS
     * @name BidUpsSetUpdate
     * @summary Обновить данные заявки ИБП
     * @request PUT:/api/bidUPS/{id}/set
     */
    bidUpsSetUpdate: (
      id: number,
      request: object,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/bidUPS/${id}/set`,
        method: "PUT",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Возвращает все заявки UPS из системы с общим количеством
     *
     * @tags bidUPS
     * @name BidUpsAllList
     * @summary Получение списка заявок UPS
     * @request GET:/api/bidUPSAll
     * @secure
     */
    bidUpsAllList: (params: RequestParams = {}) =>
      this.request<Record<string, any>, Record<string, string>>({
        path: `/api/bidUPSAll`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Удаляет компонент из расчета ИБП
     *
     * @tags Calculations UPS
     * @name CalcUpsDelete
     * @summary Удалить компонент из расчета
     * @request DELETE:/api/calcUPS
     */
    calcUpsDelete: (id: number, request: object, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/calcUPS`,
        method: "DELETE",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Устанавливает коэффициенты и мощность для расчета ИБП
     *
     * @tags Calculations UPS
     * @name CalcUpsUpdate
     * @summary Установить параметры расчета
     * @request PUT:/api/calcUPS/{id}
     */
    calcUpsUpdate: (id: number, request: object, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/calcUPS/${id}`,
        method: "PUT",
        body: request,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get list of all components - alternative version
     *
     * @tags Components
     * @name ComponentList
     * @summary Get all components (alternative endpoint)
     * @request GET:/api/component
     */
    componentList: (params: RequestParams = {}) =>
      this.request<DsComponent[], Record<string, string>>({
        path: `/api/component`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Создает новый компонент
     *
     * @tags Components
     * @name ComponentCreate
     * @summary Создание компонента
     * @request POST:/api/component
     * @secure
     */
    componentCreate: (input: DsComponent, params: RequestParams = {}) =>
      this.request<Record<string, any>, Record<string, string>>({
        path: `/api/component`,
        method: "POST",
        body: input,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Обновляет данные компонента
     *
     * @tags Components
     * @name ComponentUpdate
     * @summary Обновление компонента
     * @request PUT:/api/component/{id}
     * @secure
     */
    componentUpdate: (
      id: number,
      input: DsComponent,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/component/${id}`,
        method: "PUT",
        body: input,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Добавляет указанный компонент в текущую черновую заявку пользователя. После успешного добавления происходит редирект на главную страницу.
     *
     * @tags Components, bidUPS
     * @name ComponentCreate2
     * @summary Добавить компонент в черновик заявки
     * @request POST:/api/component/{id}
     * @originalName componentCreate
     * @duplicate
     * @secure
     */
    componentCreate2: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, any>, void | Record<string, any>>({
        path: `/api/component/${id}`,
        method: "POST",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Загружает и сохраняет изображение компонента на MinIO
     *
     * @tags Components
     * @name ComponentSetComponentImageCreate
     * @summary Установка изображения компонента
     * @request POST:/api/component/{id}/setComponentImage
     * @secure
     */
    componentSetComponentImageCreate: (
      id: number,
      data: {
        /** Image file */
        image: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<Record<string, any>, Record<string, string>>({
        path: `/api/component/${id}/setComponentImage`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * @description Возвращает детальную информацию о компоненте по указанному ID
     *
     * @tags Components
     * @name ComponentsDetail
     * @summary Получить компонент по ID
     * @request GET:/api/components/{id}
     * @secure
     */
    componentsDetail: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, any>, Record<string, any> | void>({
        path: `/api/components/${id}`,
        method: "GET",
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Удаляет компонент из системы
     *
     * @tags Components
     * @name ComponentsDelete
     * @summary Удаление компонента
     * @request DELETE:/api/components/{id}
     * @secure
     */
    componentsDelete: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/components/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Authenticates user and returns JWT token
     *
     * @tags User
     * @name LoginCreate
     * @summary User login
     * @request POST:/api/login
     */
    loginCreate: (input: DsLoginRequest, params: RequestParams = {}) =>
      this.request<DsLoginResponse, Record<string, string>>({
        path: `/api/login`,
        method: "POST",
        body: input,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Логаут и добавление JWT в черный список
     *
     * @tags User
     * @name LogoutCreate
     * @summary Выход пользователя
     * @request POST:/api/logout
     * @secure
     */
    logoutCreate: (params: RequestParams = {}) =>
      this.request<string, Record<string, string>>({
        path: `/api/logout`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Регистрирует нового пользователя
     *
     * @tags User
     * @name RegisterCreate
     * @summary Регистрация пользователя
     * @request POST:/api/register
     * @secure
     */
    registerCreate: (input: DsRegisterRequest, params: RequestParams = {}) =>
      this.request<Record<string, any>, Record<string, string>>({
        path: `/api/register`,
        method: "POST",
        body: input,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Возвращает данные пользователя по ID
     *
     * @tags User
     * @name UsersDetail
     * @summary Получение информации о пользователе
     * @request GET:/api/users/{id}
     * @secure
     */
    usersDetail: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, any>, Record<string, string>>({
        path: `/api/users/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Обновляет данные пользователя
     *
     * @tags User
     * @name UsersUpdate
     * @summary Обновление данных пользователя
     * @request PUT:/api/users/{id}
     * @secure
     */
    usersUpdate: (
      id: number,
      input: DsUpdateUserRequest,
      params: RequestParams = {},
    ) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/api/users/${id}`,
        method: "PUT",
        body: input,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
