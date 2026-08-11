import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { fetchIssueRoleUser } from '../../../store';
import { DropDown, Calendar, Icon } from 'konnect-react-components';
import styles from './AssignUserWithDate.module.scss';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import calendar from 'dayjs/plugin/calendar';
import { IUser } from '../../../types/response';
import { Col, Flex, Row } from 'antd';
import { CALANDER_DATE_FORMAT } from '../../../utils/constants';

type Props = {
    exAssignUserData: IUser[] | null;
    assignUserhandlechange: (data: IUser[]) => void;
    assignDatehandlechange: (date: string) => void;
};

dayjs.extend(calendar);
dayjs.extend(timezone);

const AssignUserWithDate = ({
    exAssignUserData,
    assignUserhandlechange,
    assignDatehandlechange,
}: Props) => {
    const roleUsers = useSelector((state: RootState) => state.issue.roleuser ?? []);
    const issueOwnerDecisionOwner = useSelector(
        (state: RootState) => state.issue.issueOwnerDecisionOwner ?? [],
    );
    const [selectedUsers, setSelectedUsers] = useState<IUser[]>();
    const [selectedDate, setSelectedDate] = useState<string | null>();
    const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
    const parentRef = useRef<HTMLDivElement>(null);
    const dispatch: AppDispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchIssueRoleUser());
    }, [dispatch]);

    useEffect(() => {
        if (exAssignUserData) {
            setSelectedUsers(exAssignUserData);
            setSelectedDate(
                exAssignUserData
                    ? exAssignUserData[0]?.dueDate
                        ? exAssignUserData[0]?.dueDate
                        : ''
                    : '',
            );
        }
    }, [exAssignUserData]);

    useEffect(() => {
        assignUserhandlechange(selectedUsers as IUser[]);
    }, [selectedUsers]);

    const handleUserChange = (tree: object[]) => {
        const selectedTree = tree as {
            label: string;
            value: string;
        }[];
        setSelectedUsers(
            selectedTree.map(tree => ({
                email: tree.value,
                fullName: tree.label,
                dueDate: selectedDate ?? '',
                firstName: '',
                isActive: true,
                lastName: '',
                userName: '',
            })),
        );
    };

    const closeCalendarAfterDateSelect = (date: string) => {
        const selectedDay = new Date(date).getDay();
        if (selectedDay === 0 || selectedDay === 6) {
            setCalendarOpen(true);
            return; // Do not close the calendar
        }

        const formattedDate = dayjs(date).tz(dayjs.tz.guess()).format(CALANDER_DATE_FORMAT);
        setSelectedDate(formattedDate);
        setCalendarOpen(false);
        assignDatehandlechange(formattedDate);
    };

    const btnClickHandler = () => setCalendarOpen(!calendarOpen);

    return (
        <Flex align="center" justify="space-between">
            <Row gutter={2} className={styles.formInputsFlexRow} align={'middle'}>
                <Col span={10}>
                    {' '}
                    <DropDown
                        className={styles['assign-users']}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            onChange: (_option: any, _checked: boolean, tree: object[]) =>
                                handleUserChange(tree),
                            options: roleUsers.map(role => ({
                                label: role.role,
                                subOption: role.users
                                    .filter(user => !issueOwnerDecisionOwner.includes(user.email))
                                    .map(user => ({
                                        label: user.fullName || user.userName || user.email,
                                        value: user.email || '',
                                        //roleId: role.roleId, // Include roleId here
                                    })),
                                value: role.role,
                            })),
                            placeholder: 'Select User',
                            selectedOptions:
                                selectedUsers &&
                                selectedUsers?.map(user => ({
                                    label: user?.fullName,
                                    value: user?.email,
                                })),
                            size: 'M',
                            type: 'tree-multiselect',
                        }}
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'S',
                            searchWholeString: true,
                        }}
                    />
                </Col>
                <Col span={12}>
                    <div ref={parentRef} className={styles.datePickerContainer}>
                        <div className={styles.dateInputWrapper} onClick={btnClickHandler}>
                            <span className={!selectedDate ? styles.placeholderText : ''}>
                                {selectedDate
                                    ? dayjs(selectedDate).tz(dayjs.tz.guess()).format('DD MMM YYYY')
                                    : 'Select due date'}
                            </span>
                            <div className={styles.calendarIconWrapper}>
                                <Icon name="calendar" size="l" color="neutrals-B200" />
                            </div>
                        </div>

                        {calendarOpen && (
                            <div className={styles.calendarPopup}>
                                <Calendar
                                    disablePastOrFutureDate={{ pastDate: new Date() }}
                                    showPicker={calendarOpen}
                                    setShowPicker={setCalendarOpen}
                                    className={styles.calendarPopup}
                                    id="assign-user-calendar"
                                    parentRef={parentRef}
                                    showDay
                                    currentDate={selectedDate ? new Date(selectedDate) : new Date()}
                                    onDateSelect={closeCalendarAfterDateSelect}
                                    paddingToPreventOverflow={20}
                                    useReactPortal={false}
                                />
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </Flex>
    );
};

export default AssignUserWithDate;
