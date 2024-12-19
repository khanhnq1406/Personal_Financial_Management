import { REDUX_TYPE } from "@/app/constants";
import { AuthAction } from "./interface";

export const setAuthReducer = (
  state = { email: null, isAuthenticated: null, fullname: null, picture: null },
  action: AuthAction
) => {
  switch (action.type) {
    case REDUX_TYPE.SET_AUTH: {
      return {
        isAuthenticated: action.payload.isAuthenticated,
        email: action.payload.email,
        fullname: action.payload.fullname,
        picture: action.payload.picture,
      };
    }
    case REDUX_TYPE.REMOVE_AUTH: {
      return {
        email: null,
        isAuthenticated: null,
        fullname: null,
        picture: null,
      };
    }
    default:
      return state;
  }
};
