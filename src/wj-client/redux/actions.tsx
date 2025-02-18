import { REDUX_TYPE } from "@/app/constants";
import {
  AuthAction,
  AuthPayload,
  ModalAction,
  ModalPayload,
} from "./interface";

export const setAuth = (payload: AuthPayload): AuthAction => {
  return {
    type: REDUX_TYPE.SET_AUTH,
    payload: payload,
  };
};

export const removeAuth = () => {
  return {
    type: REDUX_TYPE.REMOVE_AUTH,
  };
};

export const setModal = (payload: ModalPayload): ModalAction => {
  return {
    type: REDUX_TYPE.SET_MODAL,
    payload: payload,
  };
};
