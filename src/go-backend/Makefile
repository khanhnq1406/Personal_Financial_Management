.PHONY: deps build run clean test dev deploy help generate-proto clean-proto

# Directory paths for protobuf
PROTO_DIR := ../../api/protobuf
GEN_DIR := ./gen

# Install dependencies
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy
	@echo "Dependencies installed"

# Build the application for local testing (standalone server)
build:
	@echo "Building application..."
	@mkdir -p bin
	@go build -o bin/server ./cmd/server/main.go
	@echo "Build complete: bin/server"

# Build Vercel serverless function
build-vercel:
	@echo "Building Vercel function..."
	@go build -o bin/vercel-serverless ./api/vercel.go
	@echo "Build complete: bin/vercel-serverless"

# Run the standalone server locally
run:
	@echo "Running standalone server..."
	@go run ./cmd/server/main.go

# Run the application locally with Vercel dev
run-vercel:
	@echo "Running application with Vercel dev..."
	@vercel dev

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@echo "Clean complete"

# Run with hot reload using Vercel dev
dev:
	@vercel dev

# Deploy to production
deploy:
	@vercel --prod

# Deploy to preview environment
deploy-preview:
	@vercel

# Generate Go code from protobuf files
generate-proto:
	@echo "Generating Go code from protobuf files..."
	@cd ../../api && buf generate --template buf.gen.go.yaml
	@echo "Go code generation complete!"

# Clean generated Go code
clean-proto:
	@echo "Removing generated Go code..."
	@rm -rf $(GEN_DIR)
	@echo "Clean complete!"

# Show help
help:
	@echo "Available commands:"
	@echo "  make deps             - Install Go dependencies"
	@echo "  make build            - Build standalone server"
	@echo "  make build-vercel     - Build Vercel serverless function"
	@echo "  make run              - Run standalone server locally"
	@echo "  make run-vercel       - Run locally with Vercel dev"
	@echo "  make dev              - Run with hot reload (same as run-vercel)"
	@echo "  make test             - Run tests"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make deploy           - Deploy to production on Vercel"
	@echo "  make deploy-preview   - Deploy to preview on Vercel"
	@echo "  make generate-proto   - Generate Go code from protobuf files"
	@echo "  make clean-proto      - Remove generated Go code"
