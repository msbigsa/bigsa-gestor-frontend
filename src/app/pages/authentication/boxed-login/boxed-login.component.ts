import { Component, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { environment } from 'src/environments/environment';
import { LoginService } from 'src/app/services/login.service';
import { finalize } from 'rxjs';
import { SessionMonitorService } from 'src/app/services/session-monitor.service';


@Component({
  selector: 'app-boxed-login',
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  templateUrl: './boxed-login.component.html',
})
export class AppBoxedLoginComponent {
  options = this.settings.getOptions();

  username: string = '';
  password: string = '';

  loading = false;

  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly sessionMonitor = inject(SessionMonitorService);

  constructor(private settings: CoreService) { }

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit(): void {

    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.form.disable();

    const username = this.form.get('uname')?.value ?? '';
    const password = this.form.get('password')?.value ?? '';

    this.loginService
      .login(username, password)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.form.enable();
        })
      )
      .subscribe({

        next: (data) => {

          this.loginService.guardarSesion(data);

          this.sessionMonitor.start();

          this.router.navigate(['/inicio']);
        },

        error: (error) => {
          console.error(error);
        }
      });
  }
}
