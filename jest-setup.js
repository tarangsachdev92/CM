import React from 'react';
import Enzyme from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import util from 'util';
import 'jest-canvas-mock';

/**
 * Set up Enzyme to mount to DOM, simulate events,
 * and inspect the DOM in tests.
 */
Enzyme.configure({ adapter: new Adapter() });
global.React = React;


Object.defineProperty(global, 'TextEncoder', {
    value: util.TextEncoder,
});

// Mock ResizeObserver for jsdom environment
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
}));
