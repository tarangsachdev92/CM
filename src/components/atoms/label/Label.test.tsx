// Label.test.tsx
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import Label from './Label';

describe('<Label />', () => {
    it('renders label with correct text', () => {
        const text = 'Test Text';
        const wrapper = shallow(<Label type="h2">{text}</Label>);
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('renders label with type correctly', () => {
        const text = 'Test Text';
        const wrapper = shallow(<Label type="h2">{text}</Label>);
        const findTypeClass = wrapper.find('.h2');
        expect(findTypeClass).toHaveLength(1);
    });
});
