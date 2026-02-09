# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build tools
RUN apk add --no-cache make git bash

# Install Go protobuf tools
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest && \
    go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest

# Copy only the go-backend source files
COPY src/go-backend/ ./

# Copy go mod files and download
RUN go mod download

# Build the application
RUN make build

# Runtime stage
FROM golang:1.24-alpine

WORKDIR /app

# Install ca-certificates for HTTPS calls
RUN apk add --no-cache ca-certificates tzdata

# Copy the binary from builder
COPY --from=builder /app/bin/server /app/server

# Expose HTTP port (Railway will detect this automatically)
EXPOSE 8080

# Run the application
CMD ["/app/server"]
