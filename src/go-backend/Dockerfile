# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install protoc and plugins
RUN apk add --no-cache protobuf-dev

# Install Go tools
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Generate protobuf files
RUN make proto

# Build the application
RUN make build

# Runtime stage
FROM golang:1.21-alpine

WORKDIR /app

# Install ca-certificates for HTTPS calls
RUN apk add --no-cache ca-certificates

# Copy the binary from builder
COPY --from=builder /app/bin/server /app/server

# Expose gRPC port
EXPOSE 50051

# Run the application
CMD ["/app/server"]
