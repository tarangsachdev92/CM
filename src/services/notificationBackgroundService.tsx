import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { ACCCESS_TOKEN } from '../utils/constants';
import { logError } from '../utils/helpers';

let connection: HubConnection | null = null;

export const startSignalRConnection = async (
    onNotificationReceived: (message: string) => void,
): Promise<void> => {
    connection = new HubConnectionBuilder()
        .withUrl(process.env.VITE_BASE_URL + '/notificationHub', {
            accessTokenFactory: () => {
                // Optionally return your JWT token here
                return sessionStorage.getItem(ACCCESS_TOKEN) ?? '';
            },
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

    // Receive notifications from the server
    connection.on('ReceiveMessage', (message: string) => {
        onNotificationReceived(message);
    });

    try {
        await connection.start();
    } catch (err) {
        logError('SignalR connection error:', err);
    }
};

export const stopSignalRConnection = async (): Promise<void> => {
    if (connection) {
        await connection.stop();
    }
};
