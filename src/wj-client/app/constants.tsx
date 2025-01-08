export const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_PROD_BACKEND_URL
    : "http://localhost:5000";

export enum NotificationCode {
  SUCCESS = "Success",
  ERROR = "Error",
  INFO = "Info",
  WARNING = "Warning",
}

export enum HttpStatus {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLYHINTS = 103,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  AMBIGUOUS = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  REQUESTED_RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  I_AM_A_TEAPOT = 418,
  MISDIRECTED = 421,
  UNPROCESSABLE_ENTITY = 422,
  FAILED_DEPENDENCY = 424,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
}

export const LOCAL_STORAGE_TOKEN_NAME = "token";

export enum REDUX_TYPE {
  SET_AUTH = "SET_AUTH",
  REMOVE_AUTH = "REMOVE_AUTH",
}

export const routes = {
  login: "/auth/login",
  register: "/auth/register",
  dashboard: "/dashboard",
  home: `/dashboard/home`,
  transaction: `/dashboard/transaction`,
  report: `/dashboard/report`,
  budget: `/dashboard/budget`,
  wallets: `/dashboard/wallets`,
};

export const resources =
  "https://raw.githubusercontent.com/khanhnq1406/resources/main/wealthjourney/";

export const chartColors = [
  "#66bfff", // Pastel Blue (similar to #0090FF)
  "#95a8ff", // Pastel Indigo
  "#66ffcc", // Pastel Teal
  "#95e6ff", // Pastel Sky Blue
  "#d1a9ff", // Pastel Lavender
  "#66cfff", // Light Pastel Aqua
  "#66d6ff", // Pastel Cyan (similar to #00BCFF)
  "#b5d1ff", // Soft Pastel Blue
  "#a1bfff", // Pastel Periwinkle
  "#b495ff", // Pastel Violet (similar to #8C52FF)
];

export const pieChartColors = [
  "#1E90FF",
  "#32CD32",
  "#FF6347",
  "#8A2BE2",
  "#FF1493",
  "#00FA9A",
  "#FFD700",
  "#FF4500",
  "#FFD700",
  "#ADFF2F",
];
