
export type NavItem = {
    label: string;
    link: string;
    adminOnly?: boolean;
    requiresRole?: boolean;
};



export const navConfig: Record<string, NavItem[]> = {
    CC: [
        {
            label: 'Performance Management',
            link: '/performance-management',
        },
        {
            label: 'Digital Tools Library',
            link: '/digital-tools-library',
            requiresRole: true,

        },
        {
            label: 'Home',
            link: '/home',
        },
        {
            label: 'My Dashboard',
            link: '/my-dashboard',
            requiresRole: true,
        },
        {
            label: 'To-Do',
            link: '/todo',
        },
        {
            label: 'Issues',
            link: '/issues',
        },
        {
            label: 'R&O',
            link: '/ro',
        },
        {
            label: 'Settings',
            link: '/user-profile-settings',
        },
        {
            label: 'Admin Hub',
            link: '/admin-hub',
            adminOnly: true,
        },
    ],

    'Admin Hub': [
        {
            label: 'Role Management',
            link: '/admin-hub/role-management',
            adminOnly: true,
        },
        {
            label: 'Permission Management',
            link: '/admin-hub/permission-management',
            adminOnly: true,
        },
        {
            label: 'Tool Management',
            link: '/admin-hub/tool-management',
            adminOnly: true,
        },
        {
            label: 'Forum Management',
            link: '/admin-hub/Forum-Management',
            adminOnly: true,
        },
        {
            label: 'Tags',
            link: '/admin-hub/tags',
            adminOnly: true,
        },
    ],
   
    'Digital Tools Library': [
    {
        label: 'Applications',
        link: '/digital-tools-library?category=App',
        requiresRole: true,
    },
    {
        label: 'Reports',
        link: '/digital-tools-library?category=Report',
        requiresRole: true,
    },
],

    'Digital Worker': [
        {
            label: 'Troubleshooting Assistant',
            link: '/digital-worker/troubleshooting-assistant',
        },
        {
            label: 'Gemba Walk',
            link: '/digital-worker/gemba-walk',
        },
        {
            label: 'Truck Inspection',
            link: '/digital-worker/truck-inspection',
        },
    ],
};