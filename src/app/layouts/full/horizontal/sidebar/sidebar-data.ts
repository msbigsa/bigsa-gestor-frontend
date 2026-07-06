import { NavItem } from '../../vertical/sidebar/nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Starter',
    iconName: 'solar:home-angle-linear',
    route: '/starter',
  },
  {
    displayName: 'Login',
    iconName: 'solar:lock-keyhole-unlocked-outline',
    route: '/authentication/login',
  },
  {
    navCap: 'Other',
  },
  {
    displayName: 'Menu Level',
    iconName: 'solar:layers-linear',
    route: '/menu-level',
    children: [
      {
        displayName: 'Menu 1',
        iconName: 'tabler:point',
        route: '/menu-1',
        children: [
          {
            displayName: 'Menu 1',
            iconName: 'tabler:point',
            route: '/menu-1',
          },

          {
            displayName: 'Menu 2',
            iconName: 'tabler:point',
            route: '/menu-2',
          },
        ],
      },

      {
        displayName: 'Menu 2',
        iconName: 'tabler:point',
        route: '/menu-2',
      },
    ],
  },
  {
    displayName: 'Disabled',
    iconName: 'solar:forbidden-circle-linear',
    route: '/disabled',
    disabled: true,
  },
];
