export const environment = {
  production: false,
  HOST_LOGIN: 'http://localhost:8081',
  HOST_HTML: 'http://localhost:8082',
  HOST_AVISO_COBRANZA: 'http://localhost:8083',
  HOST_NOTIFICA: 'http://localhost:8084',
  // Apaga toda la funcionalidad de notificaciones (campanita, SSE, pagina de listado) sin tocar codigo,
  // por si el backend de notificaciones da problemas.
  NOTIFICACIONES_HABILITADAS: true,
  REINTENTS: 2,
  TOKEN_NAME: 'jwtToken',
  REFRESH_TOKEN_NAME: 'refreshToken',
  TOKEN_WARNING_MINUTES: 5,
  THEME_STORAGE_KEY: 'app-theme',
  //INCIDENTE_ID: 'INC-ID',
  S_K: 'aEIu9S7cvZUnPJWezau3rKUCxj4BLtpCVzhVSyam93prJOxofs7688P0OD5tmTIsLL6u7G9HpXvT'
};
