import { AuthMode } from 'src/app/models/AuthMode';

export const environment = {
  production: false,
  HOST_LOGIN: 'http://localhost:8081',
  HOST_HTML: 'http://localhost:8082',
  HOST_AVISO_COBRANZA: 'http://localhost:8083',
  HOST_NOTIFICA: 'http://localhost:8084',
  HOST_EMISION_MASIVA: 'http://localhost:8085',
  REINTENTS: 2,
  TOKEN_NAME: 'jwtToken',
  REFRESH_TOKEN_NAME: 'refreshToken',
  TOKEN_WARNING_MINUTES: 5,
  THEME_STORAGE_KEY: 'app-theme',
  // Tiene que decir lo mismo que auth.mode en ms-bigsa-auth y ms-bigsa-emision-masivas
  AUTH_MODE: 'COOKIE' as AuthMode //TOKEN | COOKIE
};
