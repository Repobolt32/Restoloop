import { Home, Store } from 'lucide-react';


import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'common:routes.home',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'Restaurant Profile',
        path: pathsConfig.app.restaurantProfile,
        Icon: <Store className={iconClasses} />,
      },
    ],
  },
];

export const navigationConfig = {
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
};
