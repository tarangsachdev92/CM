import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import HighlightSummaryWidget from './HighlightSummaryWidget';

jest.mock('react-redux', () => ({
    useDispatch: () => jest.fn(),
    useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('konnect-react-components', () => ({
    Button: ({ text, onClick }: { text: string; onClick: () => void }) => (
        <button type="button" onClick={onClick}>
            {text}
        </button>
    ),
    Flyout: ({ heading, flyoutOpen, customActions, content }: any) =>
        flyoutOpen ? (
            <div>
                <div>{heading}</div>
                {customActions}
                {content}
            </div>
        ) : null,
    Dialog: ({
        title,
        content,
        isOpen,
        onPrimaryButtonClick,
        onSecondaryButtonClick,
        primaryButtonText,
        secondaryButtonText,
    }: any) =>
        isOpen ? (
            <div>
                <div>{title}</div>
                <div>{content}</div>
                <button type="button" onClick={onSecondaryButtonClick}>
                    {secondaryButtonText}
                </button>
                <button type="button" onClick={onPrimaryButtonClick}>
                    {primaryButtonText}
                </button>
            </div>
        ) : null,
    Icon: ({ name }: { name: string }) => <span>{name}</span>,
    IconButton: ({
        icon,
        onClick,
    }: {
        icon: string;
        onClick: () => void;
    }) => (
        <button type="button" aria-label={icon} onClick={onClick}>
            {icon}
        </button>
    ),
    Switch: ({
        checked,
        onToggle,
        'aria-label': ariaLabel,
    }: {
        checked: boolean;
        onToggle: (value: boolean) => void;
        'aria-label'?: string;
    }) => (
        <button
            type="button"
            aria-label={ariaLabel}
            aria-pressed={checked}
            onClick={() => onToggle(!checked)}
        >
            {checked ? 'ON' : 'OFF'}
        </button>
    ),
}));

describe('HighlightSummaryWidget', () => {
    it('shows a draft tag and keeps edit available after saving a section as draft', () => {
        render(<HighlightSummaryWidget defaultExpanded />);

        fireEvent.click(screen.getByRole('button', { name: /edit preview supply-chain/i }));
        fireEvent.change(screen.getByLabelText(/section title/i), {
            target: { value: 'Supply Chain Draft' },
        });
        fireEvent.change(screen.getByLabelText(/section summary points/i), {
            target: { value: 'First draft point\nSecond draft point' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));

        expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Edited by John Doe,/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /edit preview supply-chain/i })).toBeInTheDocument();
    });

    it('removes the global AI disclaimer and feedback once every section is manually edited', () => {
        render(<HighlightSummaryWidget defaultExpanded />);

        ['supply-chain', 'inventory', 'operations', 'quality'].forEach(sectionId => {
            fireEvent.click(screen.getByRole('button', { name: new RegExp(`edit preview ${sectionId}`, 'i') }));
            fireEvent.change(screen.getByLabelText(/section title/i), {
                target: { value: `${sectionId} updated` },
            });
            fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));
        });

        expect(screen.queryByText(/AI generated content may contain inaccuracies/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /thumbs up/i })).not.toBeInTheDocument();
        expect(screen.queryByTestId('highlight-summary-ai-icon')).not.toBeInTheDocument();
    });

    it('saves submitted edits without showing the draft badge', () => {
        render(<HighlightSummaryWidget defaultExpanded />);

        fireEvent.click(screen.getByRole('button', { name: /edit preview supply-chain/i }));
        fireEvent.change(screen.getByLabelText(/section title/i), {
            target: { value: 'Supply Chain Submitted' },
        });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        expect(screen.queryByText('Draft')).not.toBeInTheDocument();
        expect(screen.getAllByText('Supply Chain Submitted').length).toBeGreaterThan(0);
    });

    it('uses container selection in preview mode and hides edit actions', () => {
        const handleSelect = jest.fn();

        render(<HighlightSummaryWidget mode="preview" defaultExpanded onSelect={handleSelect} />);

        fireEvent.click(screen.getByRole('button', { name: /collapse summary/i }));
        expect(handleSelect).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /generate summary/i }));
        expect(handleSelect).not.toHaveBeenCalled();

        const firstSectionTitle = screen.getAllByText('Section 1 Title Goes Here')[0] as HTMLElement;
        fireEvent.click(firstSectionTitle);
        expect(handleSelect).not.toHaveBeenCalled();

        const previewRoot = document.querySelector('[aria-pressed="false"]');
        expect(previewRoot).not.toBeNull();
        fireEvent.click(previewRoot as Element);
        expect(handleSelect).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button', { name: /edit preview supply-chain/i })).not.toBeInTheDocument();

        fireEvent.mouseEnter(screen.getByTestId('highlight-summary-widget'));
        expect(screen.queryByRole('button', { name: /chevron-up/i })).not.toBeInTheDocument();
    });

    it('opens widget setup from the action menu and saves layout changes', () => {
        render(<HighlightSummaryWidget defaultExpanded />);

        const widget = screen.getByTestId('highlight-summary-widget');
        fireEvent.mouseEnter(widget);
        fireEvent.click(screen.getByRole('button', { name: /chevron-up/i }));
        fireEvent.click(
            within(screen.getByTestId('highlight-summary-widget-actions')).getByRole('button', {
                name: /edit-02/i,
            }),
        );

        expect(screen.getByText(/Setup your widget/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /section title toggle/i }));
        fireEvent.click(screen.getByRole('button', { name: /show 2 sections per row/i }));
        fireEvent.click(screen.getByRole('button', { name: /save widget/i }));

        expect(screen.queryAllByText('Section 1 Title Goes Here')).toHaveLength(0);
    });
});