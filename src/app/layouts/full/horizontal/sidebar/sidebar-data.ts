import { NavItem } from '../../vertical/sidebar/nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Starter',
    iconName: 'home',
    route: '/starter',
  },
  {
    displayName: 'Login',
    iconName: 'lock_open',
    route: '/authentication/login',
  },
  {
    navCap: 'Other',
  },
  {
    displayName: 'Menu Level',
    iconName: 'layers',
    route: '/menu-level',
    children: [
      {
        displayName: 'Menu 1',
        iconName: 'fiber_manual_record',
        route: '/menu-1',
        children: [
          {
            displayName: 'Menu 1',
            iconName: 'fiber_manual_record',
            route: '/menu-1',
          },

          {
            displayName: 'Menu 2',
            iconName: 'fiber_manual_record',
            route: '/menu-2',
          },
        ],
      },

      {
        displayName: 'Menu 2',
        iconName: 'fiber_manual_record',
        route: '/menu-2',
      },
    ],
  },
  {
    displayName: 'Disabled',
    iconName: 'block',
    route: '/disabled',
    disabled: true,
  },
];
