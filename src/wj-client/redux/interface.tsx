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

export interface ModalPayload {
  isOpen: boolean;
  type: string; // 'Add' or 'Transfer' or 'Create'
}
export interface ModalAction extends ReduxAction {
  payload: ModalPayload;
}
