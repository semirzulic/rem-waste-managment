const { test, expect } = require('@playwright/test');

test.describe('Authentication API Tests', () => {
  const baseURL = 'http://localhost:3001';

  test.describe('POST /api/login', () => {
    test.describe('Valid Login Scenarios', () => {
      test('should login successfully with admin credentials', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'admin',
            password: 'password123'
          }
        });

        expect(response.status()).toBe(200);
        
        const body = await response.json();
        expect(body).toHaveProperty('token');
        expect(body).toHaveProperty('user');
        expect(body.user).toHaveProperty('id');
        expect(body.user).toHaveProperty('username', 'admin');
        expect(body.user).toHaveProperty('role', 'admin');
        expect(body.user).toHaveProperty('email', 'admin@remwaste.co.uk');
        expect(body.user).not.toHaveProperty('password');
        
        // Verify JWT token format
        expect(body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      });

      test('should login successfully with manager credentials', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'manager',
            password: 'manager123'
          }
        });

        expect(response.status()).toBe(200);
        
        const body = await response.json();
        expect(body).toHaveProperty('token');
        expect(body).toHaveProperty('user');
        expect(body.user).toHaveProperty('username', 'manager');
        expect(body.user).toHaveProperty('role', 'manager');
        expect(body.user).toHaveProperty('email', 'manager@remwaste.co.uk');
      });
    });

    test.describe('Invalid Login Scenarios', () => {
      test('should return 400 for missing username', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            password: 'password123'
          }
        });

        expect(response.status()).toBe(400);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Username and password required');
      });

      test('should return 400 for missing password', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'admin'
          }
        });

        expect(response.status()).toBe(400);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Username and password required');
      });

      test('should return 400 for missing both credentials', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {}
        });

        expect(response.status()).toBe(400);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Username and password required');
      });

      test('should return 401 for invalid username', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'nonexistentuser',
            password: 'password123'
          }
        });

        expect(response.status()).toBe(401);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Invalid credentials');
      });

      test('should return 401 for invalid password', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'admin',
            password: 'wrongpassword'
          }
        });

        expect(response.status()).toBe(401);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Invalid credentials');
      });

      test('should return 400 for empty string credentials', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: '',
            password: ''
          }
        });

        expect(response.status()).toBe(400);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Username and password required');
      });

      test('should handle SQL injection attempts', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: "admin'; DROP TABLE users; --",
            password: 'password123'
          }
        });

        expect(response.status()).toBe(401);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Invalid credentials');
      });

      test('should handle XSS attempts in credentials', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: '<script>alert("xss")</script>',
            password: 'password123'
          }
        });

        expect(response.status()).toBe(401);
        
        const body = await response.json();
        expect(body).toHaveProperty('error', 'Invalid credentials');
      });
    });

    test.describe('Request Format and Headers', () => {
      test('should accept JSON content type', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            username: 'admin',
            password: 'password123'
          }
        });

        expect(response.status()).toBe(200);
      });

      test('should return JSON response', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'admin',
            password: 'password123'
          }
        });

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
      });

      test('should handle malformed JSON', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          headers: {
            'Content-Type': 'application/json'
          },
          data: '{"username": "admin", "password": "password123"' // Malformed JSON - missing closing brace
        });

        expect(response.status()).toBe(500); // Backend returns 500 for JSON parsing errors

      });
    });

    test.describe('Security and Rate Limiting', () => {
      test('should not expose sensitive information in error messages', async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'admin',
            password: 'wrongpassword'
          }
        });

        expect(response.status()).toBe(401);
        
        const body = await response.json();
        expect(body.error).not.toContain('password');
        expect(body.error).not.toContain('hash');
        expect(body.error).not.toContain('bcrypt');
      });

      test('should have consistent response time for invalid credentials', async ({ request }) => {
        const start1 = Date.now();
        await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'nonexistentuser',
            password: 'password123'
          }
        });
        const time1 = Date.now() - start1;

        const start2 = Date.now();
        await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'admin',
            password: 'wrongpassword'
          }
        });
        const time2 = Date.now() - start2;

        // Response times should be relatively similar (within 200ms) to prevent timing attacks
        expect(Math.abs(time1 - time2)).toBeLessThan(200);
      });
    });

    test.describe('Token Validation', () => {
      let validToken;

      test.beforeAll(async ({ request }) => {
        const response = await request.post(`${baseURL}/api/login`, {
          data: {
            username: 'admin',
            password: 'password123'
          }
        });
        const body = await response.json();
        validToken = body.token;
      });

      test('should generate valid JWT token structure', () => {
        expect(validToken).toBeDefined();
        expect(typeof validToken).toBe('string');
        expect(validToken.split('.')).toHaveLength(3); // JWT has 3 parts
      });

      test('should include correct user information in token payload', () => {
        // Decode JWT payload (base64 decode the middle part)
        const payload = JSON.parse(
          Buffer.from(validToken.split('.')[1], 'base64').toString()
        );

        expect(payload).toHaveProperty('id');
        expect(payload).toHaveProperty('username', 'admin');
        expect(payload).toHaveProperty('role', 'admin');
        expect(payload).toHaveProperty('exp'); // Expiration time
        expect(payload).toHaveProperty('iat'); // Issued at time
      });

      test('should set appropriate token expiration', () => {
        const payload = JSON.parse(
          Buffer.from(validToken.split('.')[1], 'base64').toString()
        );

        const now = Math.floor(Date.now() / 1000);
        const expectedExpiry = now + (24 * 60 * 60); // 24 hours from now

        expect(payload.exp).toBeGreaterThan(now);
        expect(payload.exp).toBeLessThanOrEqual(expectedExpiry + 60); // Allow 1 minute tolerance
      });
    });
  });
});
