import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, } from '@angular/core';
import { provideHttpClient, HttpClient, withInterceptorsFromDi, withInterceptors } from '@angular/common/http';
import { Observable } from 'rxjs';
import { routes } from './app.routes';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';


// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

// perfect scrollbar
import { NgScrollbarModule } from 'ngx-scrollbar';
//Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { JwtModule } from '@auth0/angular-jwt';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { loadingInterceptor } from './interceptors/loading.interceptor';

export class CustomLoader implements TranslateLoader {
  constructor(private http: HttpClient, private prefix: string, private suffix: string) { }

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`${this.prefix}${lang}${this.suffix}`);
  }
}

export function HttpLoaderFactory(http: HttpClient) {
  return new CustomLoader(http, './assets/i18n/', '.json');
}

export function tokenGetter() {
  return sessionStorage.getItem(environment.TOKEN_NAME);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(), // required animations providers
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding()
    ),
    provideHttpClient(
       withInterceptors([
        loadingInterceptor
      ]), 
      withInterceptorsFromDi()
    ),
    provideClientHydration(),
    provideAnimationsAsync(),
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      MaterialModule,
      TablerIconsModule.pick(TablerIcons),
      NgScrollbarModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),

      JwtModule.forRoot({
        config: {
          tokenGetter,
          allowedDomains: [
            environment.DOMAIN_HTML
          ],
          disallowedRoutes: [
            `${environment.HOST_LOGIN}/authentication/login/forgot`,
            `${environment.HOST_LOGIN}/authentication/login`
          ]
        }
      }),

      NgxUiLoaderModule.forRoot({
        "bgsColor": "#297dd5",
        "bgsOpacity": 0.6,
        "bgsPosition": "bottom-right",
        "bgsSize": 60,
        "bgsType": "ball-scale-multiple",
        "blur": 8,
        "delay": 0,
        "fastFadeOut": true,
        "fgsColor": "#297dd5",
        "fgsPosition": "center-center",
        "fgsSize": 50,
        "fgsType": "rectangle-bounce-pulse-out",
        "gap": 24,
        "logoPosition": "center-center",
        "logoSize": 120,
        "logoUrl": "",
        "masterLoaderId": "master",
        "overlayBorderRadius": "0",
        "overlayColor": "rgba(40, 40, 40, 0.8)",
        "pbColor": "#297dd5",
        "pbDirection": "ltr",
        "pbThickness": 4,
        "hasProgressBar": true,
        "text": "Cargando...",
        "textColor": "#FFFFFF",
        "textPosition": "center-center",
        "maxTime": -1,
        "minTime": 300
      })
    ),
  ],
};

