import {
  Component,
  Output,
  EventEmitter,
  Input,
  Inject,
  ViewEncapsulation,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MenuService } from '../sidebar/sidebar-data';
import { NavItem } from '../sidebar/nav-item/nav-item';
import { TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Router, RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { LoginService } from 'src/app/services/login.service';
import { NotificacionService } from 'src/app/services/notifica/notificacion.service';
import { Usuario } from 'src/app/models/Usuario';
import { LowerCasePipe, TitleCasePipe } from '@angular/common';
import { UserAvatarComponent } from 'src/app/shared/components/user-avatar/user-avatar.component';

interface profiledd {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface apps {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    NgScrollbarModule,
    MaterialModule,
    TitleCasePipe,
    LowerCasePipe,
    UserAvatarComponent
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit {

  private loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly notificacionService = inject(NotificacionService);

  readonly notificaciones = this.notificacionService.notificaciones;
  readonly cantidadNoLeidas = this.notificacionService.cantidadNoLeidas;
  readonly notificacionesHabilitadas = this.notificacionService.habilitado;

  private menuService = inject(MenuService);

  private navItems: NavItem[] = [];

  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;

  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: './assets/images/flag/icon-flag-en.svg',
  };

  public languages: any[] = [
    {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: './assets/images/flag/icon-flag-en.svg',
    },
    {
      language: 'Español',
      code: 'es',
      icon: './assets/images/flag/icon-flag-es.svg',
    },
    {
      language: 'Français',
      code: 'fr',
      icon: './assets/images/flag/icon-flag-fr.svg',
    },
    {
      language: 'German',
      code: 'de',
      icon: './assets/images/flag/icon-flag-de.svg',
    },
  ];

  @Output() optionsChange = new EventEmitter<AppSettings>();

  private readonly login = inject(LoginService);

  usuario = signal<Usuario | null>(null);

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {
    translate.setDefaultLang('en');
  }

  ngOnInit(): void {
    this.loadProfile();

    // Al recargar la pagina con sesion vigente el login ya paso, asi que el stream
    // no arranco todavia -- si ya estaba conectado, start() lo reinicia sin problema.
    if (this.loginService.isLogged()) {
      this.notificacionService.cargarConfigs().subscribe(() => {
        this.notificacionService.start();
      });
    }
  }

  marcarLeida(notificacionId: number): void {
    this.notificacionService.marcarLeida(notificacionId);
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas();
  }

  verTodasNotificaciones(): void {
    this.router.navigate(['/inicio/notificaciones']);

    this.menuService.obtenerMenu().subscribe(categorias => {
      this.navItems = this.menuService.construirNavItems(categorias);
    });
  }

  options = this.settings.getOptions();

  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent, {
      data: this.navItems,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }

  setlightDark(theme: string) {
    this.options.theme = theme;
    this.settings.setOptions({ theme });
    this.emitOptions();
  }

  changeLanguage(lang: any): void {
    this.translate.use(lang.code);
    this.selectedLanguage = lang;
  }

  profiledd: profiledd[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-account.svg',
      title: 'Mi Perfil',
      subtitle: 'Foto e información de cuenta',
      link: '/inicio/perfil',
    },
  ];

  apps: apps[] = [
    {
      id: 1,
      img: './assets/images/svgs/icon-dd-chat.svg',
      title: 'Chat Application',
      subtitle: 'Messages & Emails',
      link: '/',
    },
    {
      id: 2,
      img: './assets/images/svgs/icon-dd-cart.svg',
      title: 'Todo App',
      subtitle: 'Completed task',
      link: '/',
    },
    {
      id: 3,
      img: './assets/images/svgs/icon-dd-invoice.svg',
      title: 'Invoice App',
      subtitle: 'Get latest invoice',
      link: '/',
    },
    {
      id: 4,
      img: './assets/images/svgs/icon-dd-date.svg',
      title: 'Calendar App',
      subtitle: 'Get Dates',
      link: '/',
    },
    {
      id: 5,
      img: './assets/images/svgs/icon-dd-mobile.svg',
      title: 'Contact Application',
      subtitle: '2 Unsaved Contacts',
      link: '/',
    },
    {
      id: 6,
      img: './assets/images/svgs/icon-dd-lifebuoy.svg',
      title: 'Tickets App',
      subtitle: 'Create new ticket',
      link: '/',
    },
    {
      id: 7,
      img: './assets/images/svgs/icon-dd-message-box.svg',
      title: 'Email App',
      subtitle: 'Get new emails',
      link: '/',
    },
    {
      id: 8,
      img: './assets/images/svgs/icon-dd-application.svg',
      title: 'Conatct List',
      subtitle: 'Create new contact',
      link: '/',
    },
  ];

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'Pricing Page',
      link: '/t',
    },
    {
      id: 2,
      title: 'Authentication Design',
      link: '/',
    },
    {
      id: 3,
      title: 'Register Now',
      link: '/',
    },
    {
      id: 4,
      title: '404 Error Page',
      link: '/',
    },
    {
      id: 5,
      title: 'Notes App',
      link: '/',
    },
    {
      id: 6,
      title: 'Employee App',
      link: '/',
    },
    {
      id: 7,
      title: 'Todo Application',
      link: '/',
    },
    {
      id: 8,
      title: 'Treeview',
      link: '/',
    },
  ];

  logout() {
    this.loginService.logout();
  }

  loadProfile(): void {
    this.loginService.cargarPerfil().subscribe();
    this.usuario = this.loginService.profile;
  }
}

@Component({
  selector: 'search-dialog',
  imports: [RouterModule, MaterialModule, FormsModule],
  templateUrl: 'search-dialog.component.html'
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItemsData: NavItem[];

  constructor(@Inject(MAT_DIALOG_DATA) navItems: NavItem[]) {
    this.navItemsData = navItems.filter((navitem) => navitem.displayName);
  }
}
