import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { setAuthReducer, setModalReducer } from "./reducer";
const rootReducer = combineReducers({
  setAuthReducer,
  setModalReducer,
});

export const store = configureStore({ reducer: rootReducer });
