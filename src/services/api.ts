import customAxios from './interceptor';
import {getClientDiagnostics} from '../../src/utils/helpers';
interface Params {
    baseUrl: string;
    chatBotUrl?: string;
    headers?: Record<string, string>;
}

const config: Params = {
    baseUrl: process.env.VITE_BASE_URL ?? '',
    chatBotUrl: process.env.VITE_CHATBOT_BASE_URL ?? ''
};

export enum AppService {
    DEFAULT = 'DEFAULT',
    CHATBOT = 'CHATBOT'
}

const baseUrls = {
    [AppService.DEFAULT]: config.baseUrl,
    [AppService.CHATBOT]: config.chatBotUrl,
}

const getBaseUrl = (service: AppService): string => {
    return baseUrls[service] || config.baseUrl;
}

export const postAPI = async (url: string, data: any, service: AppService = AppService.DEFAULT): Promise<any> => {
    const { resolution, performanceTime } = getClientDiagnostics();
    return await customAxios({
        ...config,
        method: 'post',
       url: `${getBaseUrl(service)}/${url}`,
        data,
         headers: {
      ...(config.headers || {}),
      'X-Screen-Resolution': resolution,
      'X-Browser-Performance-Time': performanceTime,
    },
    })
        .then((response: { status: number; data: any }) => {
            return {
                status: response.status,
                data: response.data,
            };
        })
        .catch((error: any) => {
            throw error;
        });
};

export const putAPI = async (url: string, data: any): Promise<any> => {
    const { resolution, performanceTime } = getClientDiagnostics();
    return await customAxios({
        ...config,
        method: 'put',
        url: `${config.baseUrl}/${url}`,
        data,
         headers: {
      ...(config.headers || {}),
      'X-Screen-Resolution': resolution,
      'X-Browser-Performance-Time': performanceTime,
    },
    })
        .then((response: { status: number; data: any }) => {
            return {
                status: response.status,
                data: response.data,
            };
        })
        .catch((error: any) => {
            throw error;
        });
};

export const getAPI = async (url: string, requestPayLoad?: any): Promise<any> => {
const { resolution, performanceTime } = getClientDiagnostics();

  return await customAxios({
    ...config,
    method: 'get',
    url: `${config.baseUrl}/${url}`,
    params: requestPayLoad,
    headers: {
      ...(config.headers || {}),
      'X-Screen-Resolution': resolution,
      'X-Browser-Performance-Time': performanceTime,
    },
  })
    .then((response: { status: number; data: any }) => {
      return {
        status: response.status,
        data: response.data,
      };
    })
    .catch((error: any) => {
      throw error;
    });
};


export const deleteAPI = async (url: string, data: any): Promise<any> => {
    const { resolution, performanceTime } = getClientDiagnostics();
    return await customAxios({
        ...config,
        method: 'delete',
        url: `${config.baseUrl}/${url}`,
        data,
        headers: {
      ...(config.headers || {}),
      'X-Screen-Resolution': resolution,
      'X-Browser-Performance-Time': performanceTime,
    },
    })
        .then((response: { status: number; data: any }) => {
            return {
                status: response.status,
                data: response.data,
            };
        })
        .catch((error: any) => {
            throw error.response;
        });
};

export const patchAPI = async (url: string, data: any): Promise<any> => {
    const { resolution, performanceTime } = getClientDiagnostics();
    return await customAxios({
        ...config,
        method: "patch",
        url: `${config.baseUrl}/${url}`,
        data,
        headers: {
      ...(config.headers || {}),
      'X-Screen-Resolution': resolution,
      'X-Browser-Performance-Time': performanceTime,
    },
    })
        .then((response: { status: number; data: any }) => {
            return {
                status: response.status,
                data: response.data,
            };
        })
        .catch((error: any) => {
            throw error.response;
        });
};
