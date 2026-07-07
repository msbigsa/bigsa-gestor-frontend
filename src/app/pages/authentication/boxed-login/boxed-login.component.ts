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

  private loginService = inject(LoginService);

  constructor(private settings: CoreService, private router: Router) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    // console.log(this.form.value);
    
    this.username = this.form.get('uname')?.value ?? '';
    this.password = this.form.get('password')?.value ?? '';
    
    this.loginService.login(this.username, this.password).subscribe(data => {  
      sessionStorage.setItem(environment.TOKEN_NAME, data.jwtToken)      
      //this.router.navigate(['/dashboards/dashboard1']);
      this.router.navigate(['/inicio']);
    });    
  }
}
