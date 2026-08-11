import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import EnvironmentPlugin from 'vite-plugin-environment';
import { version } from './package.json';
import federation from '@originjs/vite-plugin-federation';

// https://vite.dev/config/
// export default ({ mode }) => {
export default ({ mode }: { mode: string }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    return defineConfig({
        plugins: [
            react(),
            EnvironmentPlugin('all', { prefix: 'VITE_' }),

            federation({
                name: 'commandCenter',
                remotes: {
                    issueManagement: process.env.VITE_ISSUE_MANAGEMENT_URL || '',
                    dpmWrapper: process.env.VITE_DPM_URL || '',
                    advancedForecasting: process.env.VITE_ADVFORCASTING_URL || '',
                    digitalWorker:process.env.VITE_DIGITALWORKER_URL || '',
                    riskAndOpportunity: process.env.VITE_RISK_AND_OPPORTUNITY_URL || '',
                    knowledgeHub:process.env.VITE_KNOWLEDGEHUB_URL || '',
                    truckInspection: process.env.VITE_TRUCK_INSPECTION_URL || '',
                    gembaWalk: process.env.VITE_GEMBA_WALK_URL || '',
                },
                shared: [
                    'react',
                    'react-dom',
                    'react-router-dom',
                    'react-redux',
                    'redux-thunk',
                    '@reduxjs/toolkit',
                    '@azure/msal-browser',
                    '@azure/msal-react',
                     'react-i18next',
                     'i18next'
                ],
            }),
        ],
        build: {
            modulePreload: false,
            target: 'esnext',
            minify: false,
            assetsDir: 'assets',
            cssCodeSplit: false,
        },

        server: {
            watch: {
                usePolling: true, // Use polling to avoid caching issues in certain environments
            },
            port: 3000,
        },

        define: {
            __APP_VERSION__: JSON.stringify(version),
        },
    });
};
