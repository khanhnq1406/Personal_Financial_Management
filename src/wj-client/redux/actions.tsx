import { REDUX_TYPE } from "@/app/constants";
import { AuthAction, ReduxAction } from "./interface";

export const setAuth = (payload: any): AuthAction => {
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
