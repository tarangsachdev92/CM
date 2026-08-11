import { shallow } from 'enzyme';
import Home from './Home';

describe('Home Component', () => {
    it('should match the snapshot', () => {
        const wrapper = shallow(<Home />);
        expect(wrapper).toMatchSnapshot();
    });
});
