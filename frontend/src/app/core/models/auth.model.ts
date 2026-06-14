export type Rol = 'ADMIN' | 'GERENTE' | 'OPERARIO' | 'RRHH' | 'CONTADOR';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: Rol;
  permisos: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Usuario;
}
