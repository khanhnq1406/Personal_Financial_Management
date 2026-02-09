import '@testing-library/jest-dom'

// Only mock the server if we're not running integration tests that need it
// The hook tests will import and use the real server
const { server } = require('./mocks/server')

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())
