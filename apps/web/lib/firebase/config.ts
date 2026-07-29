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
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    // Strip wrapping quotes if present, then convert literal \n to actual newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\n/g, "\n")
      : ""
  }
};
console.log("Service Account Check:", {
  hasProjectId: !!serverConfig.serviceAccount.projectId,
  hasClientEmail: !!serverConfig.serviceAccount.clientEmail,
  hasPrivateKey: !!serverConfig.serviceAccount.privateKey,
  keyLength: serverConfig.serviceAccount.privateKey.length,
});