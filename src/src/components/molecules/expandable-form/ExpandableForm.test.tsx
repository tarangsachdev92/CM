import { shallow } from 'enzyme';
import ExpandableForm from './ExpandableForm';
import toJson from 'enzyme-to-json';

describe('<ExpandableForm />', () => {
    it('renders expandable form correctly', () => {
        const wrapper = shallow(
            <ExpandableForm
                title="Test Title"
                description="Test Description"
                isOpen={true}
                content={<div />}
            />,
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('test card is clickable', () => {
        const mockFun = jest.fn();
        const wrapper = shallow(
            <ExpandableForm
                title="Test Title"
                description="Test Description"
                isOpen={true}
                onClick={mockFun}
                content={<div />}
            />,
        );
        const collapseIcon: any = wrapper.find('.content-title-right-container');
        collapseIcon.props().onClick();
        wrapper.update();
        expect(mockFun).toHaveBeenCalled();
    });

    it('test card is disabled', () => {
        const wrapper = shallow(
            <ExpandableForm
                title="Test Title"
                description="Test Description"
                isOpen={true}
                disabled
                content={<div />}
            />,
        );
        const disabledClass = wrapper.find('.content-container-disabled');
        expect(disabledClass).toBeTruthy();
    });

    it('test card is opened', () => {
        const wrapper = shallow(
            <ExpandableForm
                title="Test Title"
                description="Test Description"
                isOpen={true}
                disabled
                content={<div />}
            />,
        );
        const bodyContainer = wrapper.find('.content-body-container');
        expect(bodyContainer).toBeTruthy();
    });

    it('test card is closed', () => {
        const wrapper = shallow(
            <ExpandableForm
                title="Test Title"
                description="Test Description"
                isOpen={false}
                disabled
                content={<div />}
            />,
        );
        const bodyContainer = wrapper.find('.content-body-container');
        expect(bodyContainer.exists()).toBeTruthy();
    });
});
