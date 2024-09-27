export interface GenericResponse<T> {
  status: number;
  data?: T;
  authCode?: number
}