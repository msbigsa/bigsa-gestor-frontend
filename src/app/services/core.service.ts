import { Injectable, signal } from '@angular/core';
import { AppSettings, defaults, THEMES } from '../config';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  private optionsSignal = signal<AppSettings>({
    ...defaults,
    theme: this.getSavedTheme(),
  });

  getOptions() {
    return this.optionsSignal();
  }

  setOptions(options: Partial<AppSettings>) {

    this.optionsSignal.update((current) => {
      const updated = {
        ...current,
        ...options,
      };

      if (options.theme) {
        localStorage.setItem(environment.THEME_STORAGE_KEY, options.theme);
      }

      return updated;
    });
  }

  private getSavedTheme(): 'light' | 'dark' {
    const theme = localStorage.getItem(environment.THEME_STORAGE_KEY);

    return theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  }

  setLanguage(lang: string) {
    this.setOptions({ language: lang });
  }

  getLanguage() {
    return this.getOptions().language;
  }
}
