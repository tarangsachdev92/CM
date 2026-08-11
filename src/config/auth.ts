import { LogLevel } from '@azure/msal-browser';
import { logError } from '../utils/helpers';

/**
 * Configuration object to be passed to MSAL instance on creation.
 */
export const msalConfig = {
    auth: {
        clientId: process.env.VITE_AUTH_CLIENTID || '',
        authority: process.env.VITE_AUTH_AUTHORITY || '',
        redirectUri: '/',
    },
    cache: {
        cacheLocation: 'sessionStorage', // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }

                logError(`[${level}] ${message}`);
            },
        },
    },
};

///**
// * Scopes you add here will be prompted for user consent during sign-in.
// * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
// */
export const loginRequest = {
    scopes: ['User.Read'],
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API. For more information
 */
export const graphConfig = {
    graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
