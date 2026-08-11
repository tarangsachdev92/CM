import { Flex } from 'antd';
import { Icon } from 'konnect-react-components';
import type { IUserForumRoles } from '../../../types/response';
import styles from './UserProfileSettingsRolesCard.module.scss';

interface UserProfileSettingsForumRolesCardProps {
    roleData: IUserForumRoles;
}

function UserProfileSettingsForumRolesCard({
    roleData,
}: Readonly<UserProfileSettingsForumRolesCardProps>) {
    const renderRoleName = (roleData: IUserForumRoles) => {
        let roleName = '';
        if (roleData.collabType) {
            roleName = roleName + roleData.collabType;
        }
        if (roleData.collabType && roleData.forumName) {
            roleName = roleName + ' | ' + roleData.forumName;
        }
        if (roleData.collabType && roleData.forumName && roleData.geography) {
            roleName = roleName + ', ' + roleData.geography;
        }
        return roleName;
    };

    return (
        <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            className={styles['role-container']}
        >
            <Flex justify="space-between" align="center" gap={'8px'}>
                <span id="primary-role-type-icon">
                    <Icon name="user-down-01" size="xm" color="primary-green-500-color" />
                </span>

                <span className={styles['role-request-approved-text']}>
                    {renderRoleName(roleData)}
                </span>
            </Flex>
        </Flex>
    );
}

export default UserProfileSettingsForumRolesCard;
