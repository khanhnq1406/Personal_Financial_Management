import { LOCAL_STORAGE_TOKEN_NAME } from "@/app/constants";

function updateOptions(options: any) {
  const update = { ...options };
  if (localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME)) {
    update.headers = {
      ...update.headers,
      Authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME)}`,
    };
  }
  return update;
}

export default function fetcher(url: string, options: any) {
  return fetch(url, updateOptions(options));
}
