import CryptoJS from 'crypto-js';

// Bitcoin-style proof-of-work computation
export interface PoWResult {
  nonce: number;
  hash: string;
  computeTime: number;
  difficulty: number;
}

export interface BitCommAddress {
  privateKey: string;
  publicKey: string;
  address: string;
  created: Date;
}

export interface BitCommMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  encrypted: string;
  timestamp: Date;
  pow: PoWResult;
  delivered: boolean;
}

// Generate cryptographic identity (Bitcoin-style)
export function generateBitCommIdentity(): BitCommAddress {
  const privateKey = CryptoJS.lib.WordArray.random(256/8).toString();
  const publicKey = CryptoJS.SHA256(privateKey).toString();
  const address = CryptoJS.SHA256(publicKey).toString().substring(0, 40);
  
  return {
    privateKey,
    publicKey,
    address,
    created: new Date()
  };
}

// Compute Bitcoin-style proof-of-work
export async function computeProofOfWork(
  message: string,
  difficulty: number = 4,
  onProgress?: (nonce: number, hash: string) => void
): Promise<PoWResult> {
  const startTime = Date.now();
  const target = '0'.repeat(difficulty);
  let nonce = 0;
  
  return new Promise((resolve) => {
    const compute = () => {
      for (let i = 0; i < 10000; i++) { // Process in chunks to avoid blocking
        const hashInput = message + nonce;
        const hash = CryptoJS.SHA256(hashInput).toString();
        
        if (hash.startsWith(target)) {
          const computeTime = (Date.now() - startTime) / 1000;
          resolve({
            nonce,
            hash,
            computeTime,
            difficulty
          });
          return;
        }
        
        nonce++;
        
        if (onProgress && nonce % 1000 === 0) {
          onProgress(nonce, hash);
        }
      }
      
      // Continue computation in next tick
      setTimeout(compute, 1);
    };
    
    compute();
  });
}

// Verify proof-of-work (instant verification)
export function verifyProofOfWork(message: string, pow: PoWResult): boolean {
  const hashInput = message + pow.nonce;
  const hash = CryptoJS.SHA256(hashInput).toString();
  const target = '0'.repeat(pow.difficulty);
  
  return hash === pow.hash && hash.startsWith(target);
}

// Encrypt message using recipient's public key
export function encryptMessage(message: string, publicKey: string): string {
  return CryptoJS.AES.encrypt(message, publicKey).toString();
}

// Decrypt message using private key
export function decryptMessage(encryptedMessage: string, privateKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Calculate spam economics
export interface SpamEconomics {
  messagesCount: number;
  timePerMessage: number;
  totalTime: number;
  totalDays: number;
  electricityCost: number;
  hardwareCost: number;
  totalCost: number;
}

export function calculateSpamEconomics(
  messageCount: number,
  difficulty: number,
  powerWatts: number = 50,
  electricityRate: number = 0.15,
  hashRate: number = 1000000 // hashes per second
): SpamEconomics {
  const expectedHashes = Math.pow(16, difficulty); // 16^difficulty for hex zeros
  const timePerMessage = expectedHashes / hashRate; // seconds
  const totalTime = messageCount * timePerMessage; // seconds
  const totalDays = totalTime / (24 * 3600);
  
  const energyPerMessage = (timePerMessage / 3600) * (powerWatts / 1000); // kWh
  const electricityCost = messageCount * energyPerMessage * electricityRate; // USD
  
  // Hardware cost (estimated cloud GPU rental at $1/hour)
  const hardwareCost = (totalTime / 3600) * 1; // USD
  
  return {
    messagesCount: messageCount,
    timePerMessage,
    totalTime,
    totalDays,
    electricityCost,
    hardwareCost,
    totalCost: electricityCost + hardwareCost
  };
}