import {
	containsSensitiveInfo,
	sanitizeErrorMessage,
	categorizeError,
	createSafeErrorMessage,
} from "./error-sanitizer";

describe("error-sanitizer", () => {
	describe("containsSensitiveInfo", () => {
		it("detects database connection strings", () => {
			const message =
				"failed to connect to host=postgres.railway.internal user=postgres";
			expect(containsSensitiveInfo(message)).toBe(true);
		});

		it("detects Redis connection info", () => {
			const message = "redis: connection refused at redis.internal:6379";
			expect(containsSensitiveInfo(message)).toBe(true);
		});

		it("detects token mentions", () => {
			expect(containsSensitiveInfo("invalid jwt token")).toBe(true);
			expect(containsSensitiveInfo("token verification failed")).toBe(true);
		});

		it("allows safe messages", () => {
			expect(containsSensitiveInfo("invalid credentials")).toBe(false);
			expect(containsSensitiveInfo("wallet not found")).toBe(false);
		});
	});

	describe("sanitizeErrorMessage", () => {
		it("replaces sensitive messages with safe defaults", () => {
			const sensitive =
				"database error: host=postgres.railway.internal password=secret";
			const result = sanitizeErrorMessage(sensitive);
			expect(result).not.toContain("postgres");
			expect(result).not.toContain("password");
		});

		it("preserves safe messages", () => {
			const safe = "wallet name is required";
			expect(sanitizeErrorMessage(safe)).toBe(safe);
		});

		it("uses category-specific messages", () => {
			const sensitive = "JWT token expired";
			const result = sanitizeErrorMessage(sensitive, "auth");
			expect(result).toBe("Authentication failed. Please try again.");
		});
	});

	describe("categorizeError", () => {
		it("categorizes auth errors", () => {
			expect(categorizeError(401)).toBe("auth");
			expect(categorizeError(403)).toBe("auth");
		});

		it("categorizes server errors", () => {
			expect(categorizeError(500)).toBe("server");
			expect(categorizeError(503)).toBe("server");
		});

		it("categorizes validation errors", () => {
			expect(categorizeError(400)).toBe("validation");
			expect(categorizeError(422)).toBe("validation");
		});

		it("categorizes not found errors", () => {
			expect(categorizeError(404)).toBe("notFound");
		});
	});

	describe("createSafeErrorMessage", () => {
		it("sanitizes ApiRequestError", () => {
			const error = {
				message: "database: connection to postgres.railway.internal failed",
				statusCode: 500,
			};
			const result = createSafeErrorMessage(error);
			expect(result).toBe("Server error. Please try again later.");
		});

		it("sanitizes Error objects", () => {
			const error = new Error("redis connection refused");
			const result = createSafeErrorMessage(error);
			expect(result).not.toContain("redis");
		});

		it("uses fallback for unknown errors", () => {
			const result = createSafeErrorMessage(null, "Custom fallback");
			expect(result).toBe("Custom fallback");
		});
	});
});
