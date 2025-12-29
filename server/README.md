# Login/Register API Server

A production-ready authentication server built with Node.js and Express, featuring JWT-based authentication, password reset functionality, and JSON file persistence.

## Features

### Authentication
- ✅ User registration with email validation
- ✅ User login with secure password hashing (scrypt)
- ✅ JWT access tokens (15-minute expiry)
- ✅ Refresh tokens (7-day expiry)
- ✅ Token refresh mechanism
- ✅ Logout functionality
- ✅ Password reset flow

### User Management
- ✅ Get current user profile
- ✅ Get all users
- ✅ Get user by ID
- ✅ Update user profile
- ✅ Delete user account

### Security
- ✅ Timing-safe password comparison
- ✅ Secure password hashing with scrypt
- ✅ Token-based authentication
- ✅ Input validation
- ✅ Error handling middleware
- ✅ CORS support

### Architecture
- ✅ MVC structure
- ✅ Service layer pattern
- ✅ JSON file persistence
- ✅ Modular design
- ✅ Error handling
- ✅ Request validation

## Project Structure

```
server/
├── src/
│   ├── config/              # Configuration
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utilities
│   └── app.js              # Express app setup
├── data/                   # JSON storage (gitignored)
├── app.js                  # Entry point
├── package.json
└── .env.example

```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Logout user | No |
| GET | `/me` | Get current user | Yes |
| POST | `/password-reset/request` | Request password reset | No |
| POST | `/password-reset/confirm` | Confirm password reset | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all users | Yes |
| GET | `/:id` | Get user by ID | Yes |
| PATCH | `/:id` | Update user | Yes (own account) |
| DELETE | `/:id` | Delete user | Yes (own account) |

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
DATA_DIR=./data
```

4. Start the server:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## Usage Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Password Reset Request
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'
```

### Password Reset Confirm
```bash
curl -X POST http://localhost:3000/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"token":"RESET_TOKEN","newPassword":"newpassword123"}'
```

## Data Persistence

User data is stored in JSON files in the `./data` directory:
- `users.json` - User accounts
- `refresh-tokens.json` - Active refresh tokens
- `reset-tokens.json` - Password reset tokens

The data directory is automatically created on first run and is gitignored by default.

## Development

### Project Guidelines
1. **Models** - Define data structures
2. **Services** - Business logic
3. **Controllers** - Handle HTTP requests/responses
4. **Routes** - Define API endpoints
5. **Middleware** - Request processing (auth, validation, errors)
6. **Utils** - Helper functions

### Adding New Features
1. Create service in `src/services/`
2. Create controller in `src/controllers/`
3. Add routes in `src/routes/`
4. Add middleware if needed

## Technology Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **JWT** - Authentication tokens
- **Crypto (scrypt)** - Password hashing
- **CORS** - Cross-origin support
- **Dotenv** - Environment variables

## License

ISC