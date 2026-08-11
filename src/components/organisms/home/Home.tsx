import { Flex } from 'antd';
import { QuickLinkWidget } from '../../molecules';
import { MyDashboard } from '../index';
import ToDoHome from '../todo/ToDoHome';

function Home() {
    return (
        <Flex justify="space-between" align="flex-start" gap={16}>
            <Flex vertical flex={1} gap={16}>
                <ToDoHome cardHeight="400px" />
                <QuickLinkWidget />
            </Flex>
            <Flex vertical flex={2}>
                <MyDashboard cardHeight="400px" />
            </Flex>
        </Flex>
    );
}

export default Home;
