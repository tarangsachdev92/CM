// ...existing code...
import { shallow, mount } from 'enzyme';
import FeedbackFlyout from './FeedbackFlyout';

import type { RefObject } from 'react';

interface TestRefs {
  anchorRef: RefObject<HTMLElement>;
  flyoutRef: RefObject<HTMLDivElement>;
}

const getRefs = (): TestRefs => ({
  anchorRef: { current: document.createElement('div') },
  flyoutRef: { current: document.createElement('div') },
});

describe('FeedbackFlyout', () => {
  const onClose = jest.fn();
  let refs: TestRefs;

  beforeEach(() => {
    refs = getRefs();
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const wrapper = shallow(
      <FeedbackFlyout
        anchorRef={refs.anchorRef}
        flyoutRef={refs.flyoutRef}
        onClose={onClose}
        isOpen={false}
      />
    );
    expect(wrapper.type()).toBeNull();
  });

  it('should render when isOpen is true', () => {
    const wrapper = shallow(
      <FeedbackFlyout
        anchorRef={refs.anchorRef}
        flyoutRef={refs.flyoutRef}
        onClose={onClose}
        isOpen={true}
      />
    );
    expect(wrapper.find('.feedback-flyout').exists()).toBe(true);
  });

  it('should call onClose when close button is clicked', () => {
    const wrapper = mount(
      <FeedbackFlyout
        anchorRef={refs.anchorRef}
        flyoutRef={refs.flyoutRef}
        onClose={onClose}
        isOpen={true}
      />
    );
    wrapper.find('button.feedback-closeButton').simulate('click');
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when Cancel button is clicked', () => {
    const wrapper = mount(
      <FeedbackFlyout
        anchorRef={refs.anchorRef}
        flyoutRef={refs.flyoutRef}
        onClose={onClose}
        isOpen={true}
      />
    );
    wrapper.find('button.feedback-actions-cancel').simulate('click');
    expect(onClose).toHaveBeenCalled();
  });

  it('should update feedback text area', () => {
    const wrapper = mount(
      <FeedbackFlyout
        anchorRef={refs.anchorRef}
        flyoutRef={refs.flyoutRef}
        onClose={onClose}
        isOpen={true}
      />
    );
    const textarea = wrapper.find('textarea.feedback-content-form-textarea');
    textarea.simulate('change', { target: { value: 'Test feedback' } });
    expect(wrapper.find('.feedback-charCount').text()).toContain('13/500');
  });

  it('should disable Share button when feedback or category is empty', () => {
    const wrapper = mount(
      <FeedbackFlyout
        anchorRef={refs.anchorRef}
        flyoutRef={refs.flyoutRef}
        onClose={onClose}
        isOpen={true}
      />
    );
    expect(wrapper.find('button.feedback-actions-save').prop('disabled')).toBe(true);
  });
});
