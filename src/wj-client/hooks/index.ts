// New improved hooks with better error handling
export { useGet, usePost, useMutation, getErrorMessage } from "./useApi";

// Legacy hooks (for backward compatibility)
export { useGet as useGetLegacy } from "./useGet";
export { usePost as usePostLegacy } from "./usePost";
