import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddForumFlyoutBody from './FlyoutBody';

const defaultProps = {
    forumName: 'Test Forum',
    setForumName: jest.fn(),
    forumNameError: '',
    selectedForumLevel: '',
    setSelectedForumLevel: jest.fn(),
    selectedForumPeriod: '',
    setSelectedForumPeriod: jest.fn(),
    forumLevelOptions: [{ label: 'Level 1', value: 'level1' }],
    forumPeriodOptions: [{ label: 'Q1', value: 'q1' }],
    applicationLocations: [],
    selectedGeography: '',
    geographyOptions: [{ label: 'Asia', value: 'asia' }],
    setSelectedGeography: jest.fn(),
    functionDD: [],
    selectedFunctions: [],
    setSelectedFunctions: jest.fn(),
    forumOwner1Options: [],
    forumOwner2Options: [],
    collaboratorOptions: [],
    selectedForumOwner1: [],
    setSelectedForumOwner1: jest.fn(),
    selectedForumOwner2: [],
    setSelectedForumOwner2: jest.fn(),
    selectedCollaborators: [],
    setSelectedCollaborators: jest.fn(),
    status: 1,
    setStatus: jest.fn(),
    selectedGeographies: [],
    handleGeographyChange: jest.fn(),
    setSelectedForumLevelId: jest.fn(),     
    setSelectedForumPeriodId: jest.fn(), 
};

describe('AddForumFlyoutBody', () => {
    it('renders forum name and status switch', () => {
        render(<AddForumFlyoutBody {...defaultProps} />);
        expect(screen.getByDisplayValue('Test Forum')).toBeInTheDocument();
        expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('calls setForumName when forum name changes', () => {
        render(<AddForumFlyoutBody {...defaultProps} />);
        const input = screen.getByDisplayValue('Test Forum');
        fireEvent.change(input, { target: { value: 'New Forum' } });
        expect(defaultProps.setForumName).toHaveBeenCalledWith('New Forum');
    });

    it('toggles forum status switch', () => {
        render(<AddForumFlyoutBody {...defaultProps} />);
        const switchElement = screen.getByRole('switch');
        fireEvent.click(switchElement);
        expect(defaultProps.setStatus).toHaveBeenCalledWith(0); // since initial status is 1
    });
});
