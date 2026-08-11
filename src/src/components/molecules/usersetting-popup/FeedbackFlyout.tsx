import React, { useEffect, useState } from 'react';
import styles from './FeedbackFlyout.module.scss';
import { CheckBox, DropDown } from 'konnect-react-components';
import { Input } from 'antd';

interface FeedbackFlyoutProps {
    anchorRef: React.RefObject<HTMLElement>;
    flyoutRef: React.RefObject<HTMLDivElement>;
    onClose: () => void;
    isOpen: boolean;
}

const FeedbackFlyout: React.FC<FeedbackFlyoutProps> = ({
    anchorRef,
    flyoutRef,
    onClose,
    isOpen,
}) => {
    const [category, setCategory] = useState('');
    const [rating, setRating] = useState(3);
    const [feedback, setFeedback] = useState('');
    const [contactPermission, setContactPermission] = useState(false);

    const { TextArea } = Input;
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                anchorRef.current &&
                !anchorRef.current.contains(event.target as Node) &&
                flyoutRef.current &&
                !flyoutRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, anchorRef, flyoutRef, onClose]);

    if (!isOpen) return null;

    const handleCancel = () => {
        setFeedback('');
        onClose();
    };
    return (
        <div className={styles['feedback-flyout']} ref={flyoutRef}>
            <div className={styles['feedback-content']}>
                <div className={styles['feedback-content-header']}>
                    <div className={styles['feedback-content-title']}>
                        <p className={styles['feedback-content-header-title-text']}>
                            Share Feedback
                        </p>
                        <button className={styles['feedback-closeButton']} onClick={handleCancel}>
                            ×
                        </button>
                    </div>

                    <p className={styles['feedback-content-header-subtitle']}>
                        Help us to improve your experience
                    </p>
                </div>

                <div className={styles['feedback-content-form']}>
                    <DropDown
                        className="drop-down"
                        dataTestId="feedback-category-dropdown"
                        dropdown={{
                            isDisabled: false,
                            isLabelInline: false,
                            label: 'Select Category ',
                            onChange: option => setCategory(option.value),
                            options: [
                                { label: 'Feature Request', value: 'feature' },
                                { label: 'Feedback', value: 'request' },
                            ],
                            placeholder: 'Select',
                            required: true,
                            reset: false,
                            size: 'L',
                            type: 'radio',
                        }}
                        dropdownOptionsClassName="feedback-category-dropdown-options"
                        id="feedback-category-dropdown"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />

                    <div>
                        <label className={styles['feedback-content-form-labels']}>
                            Rate Your Experience{' '}
                            <span className={styles['form-required-fields']}>*</span>
                        </label>
                        <div className={styles['feedback-stars']}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={
                                        star <= rating
                                            ? styles['feedback-filledStar']
                                            : styles['feedback-emptyStar']
                                    }
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className={styles['feedback-content-form-text-area-container']}>
                        <label className={styles['feedback-content-form-labels']}>
                            Please Tell Us More{' '}
                            <span className={styles['form-required-fields']}>*</span>
                        </label>

                        <TextArea
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Type your feedback here"
                            className={'feedback-content-form-textarea'}
                            maxLength={500}
                        />

                        <div className={styles['feedback-charCount']}>
                            {feedback.length}/500 Characters
                        </div>
                    </div>

                    <div className={styles['feedback-checkbox']}>
                        <CheckBox
                            checked={contactPermission}
                            onChange={() => setContactPermission(!contactPermission)}
                        />

                        <label className={styles['feedback-checkbox-text']}>
                            Feel free to contact me regarding my feedback
                        </label>
                    </div>
                </div>

                <div className={styles['feedback-actions']}>
                    <button className={styles['feedback-actions-cancel']} onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className={styles['feedback-actions-save']}
                        disabled={feedback == '' || category == ''}
                    >
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackFlyout;
