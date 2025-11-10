# Quick Environment Setup - 2 Minutes

## ⚡ TL;DR - What You Need to Do

### 1. Get Your Wallet Address (30 seconds)

Run this command:
```bash
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('0xefb65c23338b034b6401c6778221f3f992e3637771e4ef42bd0eab0713cdfbc3'); console.log(wallet.address);"
```

Copy the output (looks like: `0x1234567890123456789012345678901234567890`)

### 2. Update `.env` (30 seconds)

Open `.env` and find this line:
```env
VITE_PLATFORM_WALLET_ADDRESS=0x
```

Replace it with your address:
```env
VITE_PLATFORM_WALLET_ADDRESS=0x1234567890123456789012345678901234567890
```

### 3. Get Test ETH (2 minutes)

1. Go to: https://sepoliafaucet.com/
2. Paste your wallet address
3. Click "Send me ETH"
4. Wait for confirmation

---

## ✅ Verification

Your `.env` should now have these 3 lines filled:
```env
VITE_PLATFORM_PRIVATE_KEY=0xefb65c23338b034b6401c6778221f3f992e3637771e4ef42bd0eab0713cdfbc3
VITE_PLATFORM_WALLET_ADDRESS=0x1234567890123456789012345678901234567890  ← YOUR ADDRESS
VITE_FALLBACK_ETH_RATE=250000
```

---

## 🚀 You're Done!

Ready for Subtask 2: Update User Schema

**Confirm when done:** ✅
