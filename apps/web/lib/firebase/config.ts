export const firebaseConfig = {
  projectId: "agentic-marketing-3e4ca",
  appId: "1:989241935605:web:41d94f55c14125d167e7bc",
  storageBucket: "agentic-marketing-3e4ca.firebasestorage.app",
  apiKey: "AIzaSyCQVGtCudjOHdkC4qroSyz8OgGMvEUALqs",
  authDomain: "agentic-marketing-3e4ca.firebaseapp.com",
  messagingSenderId: "989241935605",
  measurementId: "G-T5R7CDJ2B3"
};

export const clientConfig = {
  ...firebaseConfig
};

export const serverConfig = {
  useSecureCookies: process.env.NODE_ENV === "production",
  firebaseApiKey: firebaseConfig.apiKey,
  serviceAccount: {
    projectId: firebaseConfig.projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : ""
  }
};
