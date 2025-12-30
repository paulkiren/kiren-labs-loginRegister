// Global E2E test setup
// This file is loaded before E2E tests run

// Ensure test environment
process.env.NODE_ENV = 'test';

// Set longer timeout for E2E tests
jest.setTimeout(30000);
