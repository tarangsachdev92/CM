import styles from './AdminConsole.module.scss';
import { Flex } from 'antd';
import { Label } from '../../atoms';
import {
    AnnouncementsIcon,
    ApplicationManagementIcon,
    DocumentationIcon,
    FAQIcon,
    LabelManagementIcon,
    PermissionManagementIcon,
    RoleManagementIcon,
    RootCauseAndCategoryManagementIcon,
    WorkflowManagementIcon,
    TagsIcon,
} from '../../../assets/icons/icons';
import { Card } from 'konnect-react-components';
import { Link } from 'react-router-dom';

import labelIcon from '../../../assets/images/Label.svg';

function AdminConsole() {
    return (
        <Flex vertical gap={24}>
            <Flex
                justify="flex-start"
                className={styles['admin-console-container']}
                vertical
                gap={8}
            >
                <Label type="h2">
                    <span className={styles['admin-console-header-title']}>Admin Hub</span>
                </Label>
                <Label type="body2">
                    <span className={styles['admin-console-header-description']}>
                        Customize settings, track performance, manage workflows, and more from
                        multiple apps with one hub
                    </span>
                </Label>
            </Flex>
            <Flex vertical className={styles['card-section']} gap={24}>
                <Label type="body1">
                    <span className={styles['card-section-title']}>Configuration</span>
                </Label>
                <Flex wrap gap={24}>
                    <Link to={'permission-management'}>
                        <Card
                            iconComponent={PermissionManagementIcon()}
                            title="Permission Management"
                            description="Control user access levels."
                            type="WithDescription"
                        />
                    </Link>
                    <Link to={'role-management'}>
                        <Card
                            iconComponent={RoleManagementIcon()}
                            title="Role Management"
                            description="Create and manage user accounts and roles"
                            type="WithDescription"
                        />
                    </Link>
                    <Link to={'tool-management'}>
                        <Card
                            iconComponent={ApplicationManagementIcon()}
                            title="Tool Management"
                            description="Access all the tools you need"
                            type="WithDescription"
                        />
                    </Link>
                    <Card
                        iconComponent={WorkflowManagementIcon()}
                        title="Workflow Management"
                        description="Streamline processes and boost productivity"
                        type="WithDescription"
                        className={styles['admin-console-card-disabled']}
                    />
                    <Card
                        iconComponent={RootCauseAndCategoryManagementIcon()}
                        title="Root Cause & Category"
                        description="Identify root cause and categorize issues"
                        type="WithDescription"
                        className={styles['admin-console-card-disabled']}
                    />
                    <Card
                        iconComponent={LabelManagementIcon()}
                        title="Label Category"
                        description="Organize categories for easy data retrieval"
                        type="WithDescription"
                        className={styles['admin-console-card-disabled']}
                    />
                    
                    <Link to={'tags'}> 
                        <Card
                            iconComponent={TagsIcon()}
                            title="Tags"
                            description="Add and Manage tags by category"
                            type="WithDescription"
                        />
                     </Link> 
                    <Link to={'Forum'}> 
                        <Card
                            iconComponent={
                                <img
                                    src={labelIcon}
                                    alt="Forums Icon"
                                    width="64"
                                    height="64"
                                    className={styles['icon-margin']}
                                />
                            }
                            title="Forums"
                            description="Setup all the forums across Kenvue"
                            type="WithDescription"
                        />
                     </Link> 
                     <Link to={'Forum-management'}> 
                        <Card
                            iconComponent={
                                <img
                                    src={labelIcon}
                                    alt="Forums Icon"
                                    width="64"
                                    height="64"
                                    className={styles['icon-margin']}
                                />
                            }
                            title="Forum Management"
                            description="Setup all the forums across Kenvue"
                            type="WithDescription"
                        />
                     </Link> 
                </Flex>
            </Flex>
            <Flex vertical className={styles['card-section']} gap={24}>
                <Label type="body1">
                    <span className={styles['card-section-title']}>Home Page</span>
                </Label>
                <Card
                    iconComponent={AnnouncementsIcon()}
                    title="Announcements"
                    description="Post and manage updates"
                    type="WithDescription"
                    className={styles['admin-console-card-disabled']}
                />
            </Flex>
            <Flex vertical className={styles['card-section']} gap={24}>
                <Label type="body1">
                    <span className={styles['card-section-title']}>Help & Support</span>
                </Label>
                <Flex gap={24}>
                    <Card
                        iconComponent={FAQIcon()}
                        title="FAQs"
                        description="Quick answers to common questions"
                        type="WithDescription"
                        className={styles['admin-console-card-disabled']}
                    />
                    <Card
                        iconComponent={DocumentationIcon()}
                        title="Documentation"
                        description="Upload and manage essential documents"
                        type="WithDescription"
                        className={styles['admin-console-card-disabled']}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
}

export default AdminConsole;
