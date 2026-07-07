import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'General',
  },
  {
    displayName: 'Inicio',
    iconName: 'solar:home-angle-line-duotone',
    route: '/inicio',
  },
  /*{
    displayName: 'Login',
    iconName: 'solar:lock-keyhole-unlocked-outline',
    route: '/authentication/login',
  },
  {
    displayName: 'Register',
    iconName: 'solar:shield-user-line-duotone',
    route: '/authentication/register',
  },*/
  {
    navCap: 'Gestión',
  },
  {
    displayName: 'HTML',
    iconName: 'solar:align-horizontal-center-line-duotone',
    route: '/menu-level',
    children: [
      {
        displayName: 'Convertir Word a HTML',
        iconName: 'bi:filetype-docx',
        route: '/inicio/conversor-doc-html',
        /*children: [
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
        ],*/
      },

      {
        displayName: 'HTML Generados',
        iconName: 'streamline-ultimate:file-html',
        route: '/lista-html',
      },
    ],
  },
  /*{
    displayName: 'Disabled',
    iconName: 'solar:bookmark-circle-line-duotone',
    route: '/disabled',
    disabled: true,
  },
  {
    displayName: 'Chip',
    iconName: 'solar:branching-paths-up-line-duotone',
    route: '/',
    chip: true,
    chipClass: 'bg-primary text-white',
    chipContent: '9',
  },
  {
    displayName: 'Outlined',
    iconName: 'solar:add-square-line-duotone',
    route: '/',
    chip: true,
    chipClass: 'bg-primary text-white',
    chipContent: 'Outlined',
  },
  {
    displayName: 'External Link',
    iconName: 'solar:link-round-angle-bold-duotone',
    route: 'https://www.google.com/',
    external: true,
  },*/
];
