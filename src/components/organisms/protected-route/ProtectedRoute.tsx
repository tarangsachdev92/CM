import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../../store';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {

    const isAdmin = useSelector((state: RootState) => state.rolePermissions.isAdmin);

    if (!isAdmin) {
        return <Navigate to="/home" replace />;
    }
    return children;
};

export default ProtectedRoute;
