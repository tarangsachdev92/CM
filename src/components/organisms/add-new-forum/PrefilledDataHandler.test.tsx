import { render } from '@testing-library/react';
import PrefilledDataHandler from './PrefilledDataHandler';
import { ILocationsData } from '../../../types/response';

describe('PrefilledDataHandler', () => {
    const mockLocations: ILocationsData[] = [
        {
            regionId: 1,
            regionName: 'Americas',
            geographyTypeId: 1,
            clusters: [
                {
                    clusterId: 10,
                    clusterName: 'North America',
                    geographyTypeId: 2,
                    markets: [
                        {
                            marketId: 100,
                            marketName: 'USA',
                            geographyTypeId: 3,
                            sites: [
                                {
                                    siteId: 1000,
                                    siteName: 'New York',
                                    geographyTypeId: 4,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];

    const geographyOptions = [
        { label: 'Americas', value: '1' },
        { label: 'North America', value: '10' },
        { label: 'USA', value: '100' },
        { label: 'New York', value: '1000' },
    ];

    const getDefaultProps = (overrides = {}) => ({
        mode: 'edit',
        prefilledData: {
            forumName: 'Test Forum',
            function: 'Finance',
            forumOwner1: 'JohnDoe@kenvue.com',
            forumOwner2: 'JaneSmith@kenvue.com',
            collaborators: 'Alice@kenvue.com, Bob@kenvue.com',
            region: '1',
            cluster: '2',
            market: '3',
            site: '4',
            repeatsEveryNumber: 2,
            repeatsEveryType: 'week',
            weekStarting: '1',
            weekOnDays: 'Monday,Tuesday',
            calendarType: 'Fiscal',
            calendarValue: 'Day',
            startingMonth: 'January',
            shiftStarting: 'Morning',
            dayStarting: '2025-07-31',
            status: 1,
        },
        functionDD: [{ label: 'Finance', value: 'finance' }],
        forumOwner1Options: [{ label: 'John Doe', value: 'john' }],
        forumOwner2Options: [{ label: 'Jane Smith', value: 'jane' }],
        collaboratorOptions: [
            { label: 'Alice', value: 'alice' },
            { label: 'Bob', value: 'bob' },
        ],
        applicationLocations: mockLocations,
        geographyOptions,
        forumLevelOptions: [{ label: 'Level 1', value: 'level1' }],
        forumPeriodOptions: [{ label: 'Q1', value: 'q1' }],
        setForumName: jest.fn(),
        setSelectedFunctions: jest.fn(),
        setSelectedForumOwner1: jest.fn(),
        setSelectedForumOwner2: jest.fn(),
        setSelectedCollaborators: jest.fn(),
        setRepeatValue: jest.fn(),
        setSelectedRepeatUnit: jest.fn(),
        setSelectedWeekNumber: jest.fn(),
        setSelectedWeekDays: jest.fn(),
        setCalendarType: jest.fn(),
        setMonthDayOption: jest.fn(),
        setYearMonth: jest.fn(),
        setSelectedShift: jest.fn(),
        setSelectedDate: jest.fn(),
        setSelectedGeography: jest.fn(),
        setStatus: jest.fn(),
        setSelectedForumLevel: jest.fn(),
        setSelectedForumPeriod: jest.fn(),
        setSelectedGeographies: jest.fn(),
        setSelectedForumLevelId: jest.fn(),
        setSelectedForumPeriodId: jest.fn(),
        ...overrides,
    });

    it('calls all setters with correct values when mode is edit and options are loaded', () => {
        const props = getDefaultProps();
        render(<PrefilledDataHandler {...props} />);
        expect(props.setForumName).toHaveBeenCalledWith('Test Forum');
        expect(props.setSelectedFunctions).toHaveBeenCalledWith(['finance']);
        expect(props.setSelectedForumOwner1).toHaveBeenCalledWith(['john']);
        expect(props.setSelectedForumOwner2).toHaveBeenCalledWith(['jane']);
        expect(props.setSelectedCollaborators).toHaveBeenCalledWith(['alice', 'bob']);
        expect(props.setRepeatValue).toHaveBeenCalledWith('2');
        expect(props.setSelectedRepeatUnit).toHaveBeenCalledWith('week');
        expect(props.setSelectedWeekNumber).toHaveBeenCalledWith('1');
        expect(props.setSelectedWeekDays).toHaveBeenCalledWith(['Monday', 'Tuesday']);
        expect(props.setCalendarType).toHaveBeenCalledWith('Fiscal');
        expect(props.setMonthDayOption).toHaveBeenCalledWith('Day');
        expect(props.setYearMonth).toHaveBeenCalledWith('January');
        expect(props.setSelectedShift).toHaveBeenCalledWith('Morning');
        expect(props.setSelectedDate).toHaveBeenCalledWith(expect.any(Date));
        expect(props.setStatus).toHaveBeenCalledWith(1);
        expect(props.setSelectedGeography).toHaveBeenCalledWith([
            {
                label: ['Americas', 'North America', 'USA', 'New York'],
                value: '1000',
                type: 'site',
            },
        ]);
    });

    it('does not call setters when mode is not edit', () => {
        const props = getDefaultProps({ mode: 'create' });
        render(<PrefilledDataHandler {...props} />);
        expect(props.setForumName).not.toHaveBeenCalled();
        expect(props.setSelectedFunctions).not.toHaveBeenCalled();
        expect(props.setSelectedForumOwner1).not.toHaveBeenCalled();
        expect(props.setSelectedForumOwner2).not.toHaveBeenCalled();
        expect(props.setSelectedCollaborators).not.toHaveBeenCalled();
        expect(props.setRepeatValue).not.toHaveBeenCalled();
        expect(props.setSelectedRepeatUnit).not.toHaveBeenCalled();
        expect(props.setSelectedWeekNumber).not.toHaveBeenCalled();
        expect(props.setSelectedWeekDays).not.toHaveBeenCalled();
        expect(props.setCalendarType).not.toHaveBeenCalled();
        expect(props.setMonthDayOption).not.toHaveBeenCalled();
        expect(props.setYearMonth).not.toHaveBeenCalled();
        expect(props.setSelectedShift).not.toHaveBeenCalled();
        expect(props.setSelectedDate).not.toHaveBeenCalled();
        expect(props.setStatus).not.toHaveBeenCalled();
        expect(props.setSelectedGeography).not.toHaveBeenCalled();
    });

    it('returns null', () => {
        const props = getDefaultProps();
        const { container } = render(<PrefilledDataHandler {...props} />);
        expect(container.firstChild).toBeNull();
    });
});
