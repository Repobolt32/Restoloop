import { Home, Store, User } from 'lucide-react';
import { z } from 'zod';


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
        label: 'Billing Center',
        path: pathsConfig.app.billing,
        Icon: <Store className={iconClasses} />,
      },
      {
        label: 'Restaurant Profile',
        path: pathsConfig.app.restaurantProfile,
        Icon: <Store className={iconClasses} />,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.profileSettings,
        Icon: <User className={iconClasses} />,
      },
    ],
  },
];

export const navigationConfig = {
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
};
