export const environment = {
  production: true,
  HOST_LOGIN: 'http://localhost:8082/ms-bigsa-auth',
  HOST_HTML: 'http://localhost:8082/ms-bigsa-html-converter',
  HOST_AVISO_COBRANZA: 'http://localhost:8082/ms-bigsa-aviso-cobranza',
  HOST_NOTIFICA: 'http://localhost:8082/ms-bigsa-notifica',
  // Apaga toda la funcionalidad de notificaciones (campanita, SSE, pagina de listado) sin tocar codigo,
  // por si el backend de notificaciones da problemas.
  NOTIFICACIONES_HABILITADAS: true,
  REINTENTS: 2,
  TOKEN_NAME: 'jwtToken',
  REFRESH_TOKEN_NAME: 'refreshToken',
  TOKEN_WARNING_MINUTES: 5,
  //INCIDENTE_ID: 'INC-ID',
  S_K: 'aEIu9S7cvZUnPJWezau3rKUCxj4BLtpCVzhVSyam93prJOxofs7688P0OD5tmTIsLL6u7G9HpXvT'
};
