// Quick script to generate a test Ethereum wallet
import { Wallet } from 'ethers';

console.log('\n🔐 Generating Test Ethereum Wallet...\n');

const wallet = Wallet.createRandom();

console.log('✅ Wallet Generated!\n');
console.log('📍 Address:', wallet.address);
console.log('🔑 Private Key:', wallet.privateKey);
console.log('\n⚠️  IMPORTANT:');
console.log('   - This is for TESTING only (Sepolia testnet)');
console.log('   - Never use this wallet for real ETH');
console.log('   - Add this private key to your .env file');
console.log('   - Get test ETH from: https://sepoliafaucet.com/\n');
