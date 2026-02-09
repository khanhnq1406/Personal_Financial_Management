// Polyfill fetch, Headers, Request, and Response for MSW in Jest/jsdom environment
// This file must be loaded before any other test files (setupFiles)
const nodeFetch = require('node-fetch')
const { TextDecoder, TextEncoder } = require('util')

// Polyfill globals if not available - MUST happen before MSW imports
if (!global.fetch) {
  global.fetch = nodeFetch
  global.Headers = nodeFetch.Headers
  global.Request = nodeFetch.Request
  global.Response = nodeFetch.Response
  global.TextDecoder = TextDecoder
  global.TextEncoder = TextEncoder
}

// Also polyfill for the global scope
global.AbortController = global.AbortController || require('abort-controller')
