import { AuthMode } from 'src/app/models/AuthMode';

export const environment = {
  production: true,
  HOST_LOGIN: 'http://localhost:8082/ms-bigsa-auth',
  HOST_HTML: 'http://localhost:8082/ms-bigsa-html-converter',
  HOST_AVISO_COBRANZA: 'http://localhost:8082/ms-bigsa-aviso-cobranza',
  HOST_NOTIFICA: 'http://localhost:8082/ms-bigsa-notifica',
  HOST_EMISION_MASIVA: 'http://localhost:8082/ms-bigsa-emision-masivas',
  REINTENTS: 2,
  TOKEN_NAME: 'jwtToken',
  REFRESH_TOKEN_NAME: 'refreshToken',
  TOKEN_WARNING_MINUTES: 5,
  // Tiene que decir lo mismo que auth.mode en ms-bigsa-auth y ms-bigsa-emision-masivas
  AUTH_MODE: 'TOKEN' as AuthMode
};
