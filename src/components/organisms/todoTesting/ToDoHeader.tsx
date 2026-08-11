import { Tab } from 'konnect-react-components';
import { useTranslation } from 'react-i18next';
interface Props {
    count?: number;
}

function ToDoHeader({ count }: Props) {
    const { t } = useTranslation('user-home-translation');

    const options = [
        {
            label: t('todo.myTodos'),
            ...(count !== undefined && { count: count }),
        },
        {
            count: undefined,
            label: t('todo.teamsTodo'),
            isDisabledTab: true,
        },
    ];

    return <Tab items={options} fullWidthTabs={true} onClick={() => {}} />;
}

export default ToDoHeader;
