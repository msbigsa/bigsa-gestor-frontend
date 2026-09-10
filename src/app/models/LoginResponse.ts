export interface LoginResponse {
  // null cuando auth.mode: COOKIE -- viajan en cookies HttpOnly, no en el body
  jwtToken: string | null;
  refreshToken: string | null;
}