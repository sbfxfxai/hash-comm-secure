import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import CryptoJS from 'crypto-js'
import { computeProofOfWork, verifyProofOfWork, encryptMessage, decryptMessage } from './lib/bitcomm'

// Make crypto functions globally available
;(window as any).CryptoJS = CryptoJS
;(window as any).computeProofOfWork = computeProofOfWork
;(window as any).verifyProofOfWork = verifyProofOfWork
;(window as any).encryptMessage = encryptMessage
;(window as any).decryptMessage = decryptMessage

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
