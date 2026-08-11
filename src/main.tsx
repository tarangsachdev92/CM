import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { ApplicationInsights, ITelemetryItem } from '@microsoft/applicationinsights-web';
import App from './App';
import { store, persistor } from './store';
import { msalConfig } from './config/auth';
import { getCurrentUserEmail } from './utils/helpers';
import './assets/css/fonts.scss';
import './i18n';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { UiKitProvider } from './ui-kit/src';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize Application Insights
const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
  },
});
appInsights.loadAppInsights();

// Telemetry initializer to enrich telemetry with user email
appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
  if (envelope.baseData && typeof envelope.baseData === 'object') {
    const screenResolution = `${window.innerWidth}x${window.innerHeight}`;
    const performanceTime = performance.now().toFixed(2);

    // Ensure properties object exists
    envelope.baseData.properties = envelope.baseData.properties || {};

    // Add custom properties
    envelope.baseData.properties.EmailID = getCurrentUserEmail();
    envelope.baseData.properties.ScreenResolution = screenResolution;
    envelope.baseData.properties.PerformanceTime = performanceTime;
  }
});



// Render the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <Provider store={store}>
    <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter>
            <UiKitProvider>
              <App /> 
            </UiKitProvider>
        </BrowserRouter>
      </MsalProvider>
    </PersistGate>
  </Provider>
);
