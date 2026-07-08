import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

interface ILoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  private url: string = `${environment.HOST_LOGIN}/auth/login`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(username: string, password: string){
    const body: ILoginRequest = {username, password};
    return this.http.post<any>(this.url, body);
  }

  logout(){
    sessionStorage.clear();
    //console.log(`sessionStorage.clear() ejecutado`);
    this.router.navigate(['authentication/login']);
  }

  isLogged(){
    const token = sessionStorage.getItem(environment.TOKEN_NAME);
    return token != null;
  }

  sendMail(username: string) {
    return this.http.post<number>(`${environment.HOST_LOGIN}/mail/sendMail`, username, {
      headers: new HttpHeaders().set('Content-Type', 'text/plain')
    });
  }
  
  checkTokenReset(random: string) {
    return this.http.get<number>(`${environment.HOST_LOGIN}/mail/reset/check/${random}`);
  }
  
  reset(random: string, newPassword: string) {
    return this.http.post(`${environment.HOST_LOGIN}/mail/reset/${random}`, newPassword, {
      headers: new HttpHeaders().set('Content-Type', 'text/plain')
    });
  }
}
