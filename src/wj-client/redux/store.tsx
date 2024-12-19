import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { setAuthReducer } from "./reducer";
const rootReducer = combineReducers({
  setAuthReducer,
});

export const store = configureStore({ reducer: rootReducer });
