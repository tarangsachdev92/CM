import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '../../../store';
import { Flex } from 'antd';
import { AnimatedLoaders } from 'konnect-react-components';

const ProtectedRouteForGuestUser = ({ children }: { children: JSX.Element }) => {
    const userPrimaryRole = useSelector((state: RootState) => state.userRole.primary);
    const isLoading = useSelector((state: RootState) => state.userRole.isLoading);
    const location = useLocation();

    if (isLoading || typeof userPrimaryRole?.isAnyADGroupRequested === 'undefined') {
        return (
            <Flex align="center" justify="center" style={{ height: '584px' }}>
                <AnimatedLoaders id="page-loader" type="page" />
            </Flex>
        );
    }

    if (!userPrimaryRole.isAnyADGroupRequested) {
        return <Navigate to={location.pathname} replace />;
    }

    return children;
};

export default ProtectedRouteForGuestUser;
