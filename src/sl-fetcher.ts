import { SLFetcherError } from './sl-fetcher-error';

type ResponseType = 'json' | 'text' | 'arrayBuffer' | 'blob';

type CustomConfig = {
  responseType?: ResponseType;
  fetchConfig?: RequestInit;
} & RequestInit;

type SLFetcherConfig = {
  baseURL?: string;
};

type RequestMethod = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE';

type RequestInterceptor = (
  url: string,
  config: RequestInit,
) => Promise<void | CustomConfig>;

type ResponseInterceptor = (res: Response) => void;

export class SLFetcher {
  private defaultConfig: CustomConfig = {
    responseType: 'json',
  };

  baseURL: string;
  requestInterceptors: Set<RequestInterceptor> = new Set();
  responseInterceptors: Set<ResponseInterceptor> = new Set();

  constructor(config?: SLFetcherConfig) {
    this.baseURL = config?.baseURL || '';

    if (this.baseURL[this.baseURL.length - 1] === '/') {
      this.baseURL = this.baseURL.slice(0, -1);
    }
  }

  async get<T>(url: string, config?: CustomConfig) {
    return this.request<T, undefined>(url, 'GET', undefined, config);
  }

  async delete<T>(url: string, config?: CustomConfig) {
    return this.request<T, undefined>(url, 'DELETE', undefined, config);
  }

  async post<T, D>(url: string, data: D, config?: CustomConfig) {
    return this.request<T, D>(url, 'POST', data, config);
  }

  async patch<T, D = unknown>(url: string, data: D, config?: CustomConfig) {
    return this.request<T, D>(url, 'PATCH', data, config);
  }

  async put<T, D = unknown>(url: string, data: D, config?: CustomConfig) {
    return this.request<T, D>(url, 'PUT', data, config);
  }

  async request<T, D>(
    url: string,
    method: RequestMethod,
    data?: D,
    config = this.defaultConfig,
  ) {
    let modifyedConfig: typeof config = {
      ...config?.fetchConfig,
      method,
    };

    for (const interceptor of this.requestInterceptors) {
      modifyedConfig = {
        ...modifyedConfig,
        ...(await interceptor(url, modifyedConfig)),
      };
    }

    const res = await fetch(
      `${this.baseURL}/${this.formatURL(url)}`,
      data ? this.fetchDataConfig(data, modifyedConfig) : modifyedConfig,
    );

    if (res.ok) {
      for (const interceptor of this.responseInterceptors) {
        interceptor(res);
      }

      return this.parseResponce<T>(res, config?.responseType);
    }

    throw await this.createError(res);
  }

  async createError(res: Response) {
    return new SLFetcherError(
      res.statusText,
      res,
      res.headers.get('Content-Type')?.includes('application/json')
        ? await res.json()
        : undefined,
    );
  }

  async parseResponce<T>(res: Response, type?: ResponseType) {
    try {
      if (type === 'blob') return (await res.blob()) as T;
      if (type === 'arrayBuffer') return (await res.arrayBuffer()) as T;
      if (type === 'text') return (await res.text()) as T;

      return (await res.json()) as T;
    } catch {
      throw new SLFetcherError(
        `Config field: "responseType" is incorrect: ${type}. Received Content-Type: ${res.headers.get('Content-Type')}`,
        res,
      );
    }
  }

  fetchDataConfig(data: unknown, config?: RequestInit): RequestInit {
    if (data instanceof FormData) {
      return {
        body: data,
        ...config,
      };
    }

    const init: RequestInit = {
      ...config,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        ...config?.headers,
      },
    };

    if (!init.body) {
      init.body = JSON.stringify(data);
    }

    return init;
  }

  formatURL(url: string) {
    if (url[0] === '/') return url.slice(1);
    return url;
  }
}
