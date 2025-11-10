# MetaMask Setup Guide - Secure Crypto Integration

## Overview

The platform now uses **MetaMask for all transactions** - no private keys are stored in the application. This is the most secure approach for handling cryptocurrency payments.

---

## What You Need to Do

### 1. Install MetaMask Browser Extension

1. Visit: https://metamask.io/
2. Click "Download"
3. Select your browser (Chrome, Firefox, Edge, etc.)
4. Install the extension
5. Create a new wallet or import existing one

### 2. Add Your MetaMask Wallet Address to `.env`

Once you have MetaMask installed:

1. Open MetaMask extension
2. Click on your account name at the top
3. Copy your wallet address (starts with `0x`)
4. Update `.env`:

```env
VITE_PLATFORM_WALLET_ADDRESS=0x1234567890123456789012345678901234567890
```

### 3. Ensure You're on Sepolia Testnet

1. Open MetaMask
2. Click the network dropdown (top left)
3. Select "Sepolia Test Network"
4. If not visible, enable "Show test networks" in settings

### 4. Get Test ETH

1. Visit: https://sepoliafaucet.com/
2. Paste your wallet address
3. Click "Send me ETH"
4. Wait for confirmation (1-2 minutes)

Check your balance in MetaMask - should show ETH in Sepolia network.

---

## How It Works

### Transaction Flow

```
User clicks "Send Payment"
    ↓
App calls useMetaMask hook
    ↓
MetaMask popup appears
    ↓
User reviews transaction details
    ↓
User clicks "Confirm" in MetaMask
    ↓
MetaMask signs transaction with user's private key
    ↓
Transaction sent to Sepolia blockchain
    ↓
App receives transaction hash
    ↓
Transaction confirmed
```

### Security Benefits

✅ **Private keys never leave MetaMask** - Only MetaMask has access  
✅ **User controls all transactions** - Must approve each one  
✅ **No server-side key storage** - Can't be hacked from our servers  
✅ **Transparent transactions** - User sees exactly what they're signing  
✅ **Testnet only** - Using Sepolia, not real money  

---

## Integration Points

### For Sellers (Receiving Payouts)

1. Seller provides their MetaMask wallet address during registration
2. Official approves payout
3. App calls `useMetaMask().sendTransaction()`
4. Seller's MetaMask receives transaction request
5. Seller approves in MetaMask
6. ETH sent to seller's wallet

### For Buyers (Making Payments)

1. Buyer clicks "Buy Item"
2. App calculates ETH amount
3. App calls `useMetaMask().sendTransaction()`
4. Buyer's MetaMask receives transaction request
5. Buyer approves in MetaMask
6. ETH sent to platform wallet

---

## Code Examples

### Connect MetaMask

```typescript
import { useMetaMask } from "@/hooks/useMetaMask";

function MyComponent() {
  const { connect, isConnected, account } = useMetaMask();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect MetaMask</button>
      ) : (
        <p>Connected: {account}</p>
      )}
    </div>
  );
}
```

### Send Transaction

```typescript
const { sendTransaction, loading, error } = useMetaMask();

const handlePayment = async () => {
  const txHash = await sendTransaction(
    "0xRecipientAddress",
    0.02, // 0.02 ETH
    "Payment for item #123"
  );

  if (txHash) {
    console.log("Transaction sent:", txHash);
  }
};
```

### Wait for Confirmation

```typescript
const { sendTransaction, waitForTx } = useMetaMask();

const handlePaymentWithConfirmation = async () => {
  const txHash = await sendTransaction(
    "0xRecipientAddress",
    0.02
  );

  if (txHash) {
    // Wait for 1 confirmation
    const receipt = await waitForTx(txHash, 1);
    if (receipt) {
      console.log("Transaction confirmed!");
    }
  }
};
```

---

## Environment Variables

Your `.env` now has:

```env
# ✅ Already configured:
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org
VITE_USE_METAMASK=true
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_BLOCK_EXPLORER=https://sepolia.etherscan.io

# ⚠️ YOU NEED TO ADD:
VITE_PLATFORM_WALLET_ADDRESS=0x  ← YOUR METAMASK ADDRESS
```

---

## Files Created

1. **`src/services/metamaskService.ts`** (380+ lines)
   - Core MetaMask integration
   - Connection, transactions, balance checking
   - Event listeners for account/chain changes

2. **`src/hooks/useMetaMask.ts`** (200+ lines)
   - React hook for easy component integration
   - Auto-connects on mount
   - Handles loading/error states
   - Transaction methods

3. **`src/config/cryptoConfig.ts`** (Updated)
   - Removed private key references
   - Added MetaMask configuration
   - Removed private key validation

---

## Testing the Setup

### Test 1: Check MetaMask Installation

```typescript
import { isMetaMaskInstalled } from "@/services/metamaskService";

console.log(isMetaMaskInstalled()); // Should be true
```

### Test 2: Connect to MetaMask

```typescript
import { connectMetaMask } from "@/services/metamaskService";

const address = await connectMetaMask();
console.log("Connected:", address);
```

### Test 3: Check Balance

```typescript
import { getWalletBalance } from "@/services/metamaskService";

const balance = await getWalletBalance("0xYourAddress");
console.log("Balance:", balance, "ETH");
```

### Test 4: Send Test Transaction

```typescript
import { sendEthTransaction } from "@/services/metamaskService";

const txHash = await sendEthTransaction({
  toAddress: "0xRecipientAddress",
  amountEth: 0.001,
  description: "Test transaction"
});

console.log("Transaction hash:", txHash);
```

---

## Troubleshooting

### "MetaMask is not installed"
- Install MetaMask extension from https://metamask.io/
- Refresh the page

### "No MetaMask account connected"
- Click MetaMask extension
- Click "Connect" or "Sign in"
- Select your account

### "Wrong network"
- Click MetaMask network dropdown
- Select "Sepolia Test Network"
- If not visible, enable test networks in settings

### "Insufficient balance"
- Get more Sepolia ETH from faucet
- Visit https://sepoliafaucet.com/
- Paste your address and request ETH

### Transaction fails
- Check gas price on https://sepolia.etherscan.io/
- Ensure you have enough ETH for gas
- Try again with higher gas limit

---

## Next Steps

✅ **Subtask 1**: Exchange Rate System (DONE)  
✅ **MetaMask Setup**: (DONE)  
⏭️ **Subtask 2**: Update User Schema

Ready to proceed with Subtask 2?

---

## Security Checklist

- ✅ No private keys in code
- ✅ No private keys in `.env`
- ✅ No private keys in database
- ✅ All transactions user-approved
- ✅ Using testnet only
- ✅ MetaMask handles key management

**Your crypto is secure!** 🔒
