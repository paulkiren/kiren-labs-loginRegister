# Login/Register System

A full-stack authentication template with React Native mobile app, React web client, and Node.js backend server.

## Project Structure

```
.
├── mobile/          # React Native mobile application
├── clientWeb/       # React web application
└── server/          # Node.js backend API server
```

## Components

### Mobile App
- **Technology**: React Native 0.76.5, React 18.3.1
- **Description**: Cross-platform mobile application for iOS and Android
- **Location**: `/mobile`
- **Features**: Dark mode support, modern functional components with hooks

### Web Client
- **Technology**: React 18.3.1, React Scripts 5.0.1
- **Description**: Web-based client application
- **Location**: `/clientWeb`
- **Features**: React Router, Axios for API calls

### Backend Server
- **Technology**: Node.js with Express 4.19.2
- **Description**: API server for login/register endpoints
- **Location**: `/server`
- **Features**: JWT authentication, bcrypt password hashing, CORS support

## Requirements

- Node.js >= 18
- npm or yarn
- For mobile development:
  - iOS: Xcode 12 or higher, CocoaPods
  - Android: Android Studio, JDK 11 or higher

## Getting Started

### Backend Server
```bash
cd server
npm install
npm start
```

The server will start on the configured port (check app.js for details).

### Web Client
```bash
cd clientWeb
npm install
npm start
```

The web app will open at http://localhost:3000

### Mobile App
```bash
cd mobile
npm install
```

For iOS:
```bash
npm run ios
# or
npx react-native run-ios
```

For Android:
```bash
npm run android
# or
npx react-native run-android
```

Note: For iOS, you may need to install CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

## Development

### Mobile
- Start Metro bundler: `npm start`
- Run iOS: `npm run ios`
- Run Android: `npm run android`
- Lint: `npm run lint`

### Web
- Start dev server: `npm start`
- Build production: `npm build`
- Run tests: `npm test`

### Server
- Start server: `npm start`
- Development with auto-reload: `npm run dev`

## Author

Kiren Paul - [Kiren Labs](https://github.com/kiren-labs)

## License

ISC
