import axios from 'axios';

// Create an instance of Axios
const customAxios = axios.create();

// Add a request interceptor
const accessToken = sessionStorage.getItem('accessToken');
customAxios.defaults.headers.common.timezoneoffset = new Date().getTimezoneOffset();
customAxios.defaults.headers.common.authorization = 'Bearer ' + accessToken;
customAxios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        // Check if the error status is 401
        if (error.response.status === 401) {
            //   msalInstance.loginRedirect();
            // Redirect to the login page or perform any other action
        }
        if (error.response.status === 403) {
            window.location.href = '/accessdenied';
        }
        return Promise.reject(error as Error);
    },
);

// Separate Axios instance for profile picture
const profileAxios = axios.create();
const profileAccessToken = sessionStorage.getItem('profileAccessToken');
profileAxios.defaults.headers.common.timezoneoffset = new Date().getTimezoneOffset();
profileAxios.defaults.headers.common.authorization = 'Bearer ' + profileAccessToken;

profileAxios.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 401) {
            // Handle unauthorized access for profile API
        }
        if (error.response.status === 403) {
            window.location.href = '/accessdenied';
        }
        return Promise.reject(new Error('Something went wrong'));
    },
);

export default customAxios;
export { profileAxios };
