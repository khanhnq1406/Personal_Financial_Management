.PHONY: deps build run clean test dev deploy help

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

# Show help
help:
	@echo "Available commands:"
	@echo "  make deps           - Install Go dependencies"
	@echo "  make build         - Build standalone server"
	@echo "  make build-vercel  - Build Vercel serverless function"
	@echo "  make run           - Run standalone server locally"
	@echo "  make run-vercel    - Run locally with Vercel dev"
	@echo "  make dev           - Run with hot reload (same as run-vercel)"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make deploy        - Deploy to production on Vercel"
	@echo "  make deploy-preview - Deploy to preview on Vercel"
