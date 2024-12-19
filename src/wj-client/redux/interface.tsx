export interface ReduxAction {
  type: string;
  payload?: object;
}

export interface AuthPayload {
  isAuthenticated: boolean;
  email: string;
  fullname: string;
  picture: string;
}

export interface AuthAction extends ReduxAction {
  payload: AuthPayload;
}
