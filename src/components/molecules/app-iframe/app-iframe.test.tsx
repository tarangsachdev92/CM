import { shallow } from 'enzyme';
import AppIFrame from './app-iframe';

describe('AppIFrame', () => {
    const url = 'https://example.com';

    it('should render without crashing', () => {
        const wrapper = shallow(<AppIFrame url={url} />);
        expect(wrapper.exists()).toBe(true);
    });

    it('should render an iframe with the correct src', () => {
        const wrapper = shallow(<AppIFrame url={url} />);
        const iframe = wrapper.find('iframe');
        expect(iframe.exists()).toBe(true);
        expect(iframe.prop('src')).toBe(url);
    });

    it('should set the correct title, width, height, and style', () => {
        const wrapper = shallow(<AppIFrame url={url} />);
        const iframe = wrapper.find('iframe');
        expect(iframe.prop('title')).toBe('iFrame');
        expect(iframe.prop('width')).toBe('100%');
        expect(iframe.prop('height')).toBe('100%');
        expect(iframe.prop('style')).toEqual({ border: 'none' });
    });

    it('should set referrerPolicy to no-referrer', () => {
        const wrapper = shallow(<AppIFrame url={url} />);
        const iframe = wrapper.find('iframe');
        expect(iframe.prop('referrerPolicy')).toBe('no-referrer');
    });

    it('should be wrapped in a div', () => {
        const wrapper = shallow(<AppIFrame url={url} />);
        expect(wrapper.type()).toBe('div');
    });
});
