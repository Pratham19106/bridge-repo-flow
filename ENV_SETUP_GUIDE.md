# Environment Setup Guide - Crypto Payment Feature

## Current Status
Your `.env` file has been updated with the crypto configuration structure. Now you need to add your specific values.

---

## What You Need to Add

### 1. **Platform Wallet Address** ⚠️ REQUIRED

**Location in `.env`**: Line 19
```env
VITE_PLATFORM_WALLET_ADDRESS=0x
```

**What is it?**
- The Ethereum address of your platform wallet on Sepolia testnet
- This is where buyers will send ETH payments
- Must correspond to the private key in `VITE_PLATFORM_PRIVATE_KEY`

**How to get it?**

**Option A: If you already have the private key** (Recommended)
```bash
# Use ethers.js to derive the address from your private key
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('0xefb65c23338b034b6401c6778221f3f992e3637771e4ef42bd0eab0713cdfbc3'); console.log(wallet.address);"
```

**Option B: Generate a new wallet**
1. Visit: https://vanity-eth.tk/
2. Click "Generate"
3. Copy the address (starts with `0x`)
4. Copy the private key (starts with `0x`)
5. Update both in `.env`:
   ```env
   VITE_PLATFORM_WALLET_ADDRESS=0x<your_new_address>
   VITE_PLATFORM_PRIVATE_KEY=0x<your_new_private_key>
   ```

**Example**:
```env
VITE_PLATFORM_WALLET_ADDRESS=0x1234567890123456789012345678901234567890
```

---

## Complete `.env` Reference

Here's what your final `.env` should look like:

```env
# ========================================
# SUPABASE CONFIGURATION (Already set)
# ========================================
VITE_SUPABASE_PROJECT_ID="bgicupbqmgaoenyqvhdh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnaWN1cGJxbWdhb2VueXF2aGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjE1NDAsImV4cCI6MjA3ODIzNzU0MH0.l8CFNezPyarqGVTfINTijD68Zy1g4UMg-yk2W0dB7Zg"
VITE_SUPABASE_URL="https://bgicupbqmgaoenyqvhdh.supabase.co"

# ========================================
# SEPOLIA TESTNET CRYPTO CONFIGURATION
# ========================================

# Sepolia RPC URL (Public endpoint - already set)
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Platform wallet private key (for sending ETH payouts to sellers)
VITE_PLATFORM_PRIVATE_KEY=0xefb65c23338b034b6401c6778221f3f992e3637771e4ef42bd0eab0713cdfbc3

# Platform wallet address (for receiving payments from buyers)
# ⚠️ YOU NEED TO ADD THIS - derive from your private key above
VITE_PLATFORM_WALLET_ADDRESS=0x<ADD_YOUR_ADDRESS_HERE>

# ========================================
# EXCHANGE RATE CONFIGURATION
# ========================================

# CoinGecko API for real-time ETH/INR rates (No API key needed)
VITE_EXCHANGE_RATE_API=https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr

# Fallback exchange rate if API fails (1 ETH = X INR)
VITE_FALLBACK_ETH_RATE=250000

# ========================================
# METAMASK CONFIGURATION
# ========================================

# Sepolia Chain ID
VITE_SEPOLIA_CHAIN_ID=11155111

# Sepolia Block Explorer
VITE_SEPOLIA_BLOCK_EXPLORER=https://sepolia.etherscan.io
```

---

## Step-by-Step Setup

### Step 1: Get Your Platform Wallet Address

Run this command in your terminal:
```bash
npm install ethers
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('0xefb65c23338b034b6401c6778221f3f992e3637771e4ef42bd0eab0713cdfbc3'); console.log('Address:', wallet.address);"
```

You'll see output like:
```
Address: 0x1234567890123456789012345678901234567890
```

### Step 2: Update `.env`

Replace `0x<ADD_YOUR_ADDRESS_HERE>` with your actual address:
```env
VITE_PLATFORM_WALLET_ADDRESS=0x1234567890123456789012345678901234567890
```

### Step 3: Get Sepolia Test ETH

Your platform wallet needs ETH to send payouts to sellers.

1. Visit: https://sepoliafaucet.com/
2. Enter your platform wallet address
3. Request test ETH
4. Wait for confirmation (usually 1-2 minutes)

Check balance at: https://sepolia.etherscan.io/address/0x<your_address>

### Step 4: Verify Setup

Run this to verify everything is configured:
```bash
npm run dev
```

Check browser console for:
```
Exchange rate service initialized
Platform wallet configured: 0x1234567890123456789012345678901234567890
```

---

## Security Notes ⚠️

1. **Never commit `.env` to git** - Add to `.gitignore`
2. **Keep private key secret** - This can drain your wallet
3. **For production** - Use AWS KMS, HashiCorp Vault, or hardware wallet
4. **Test thoroughly** - Use Sepolia testnet only, never mainnet

---

## Troubleshooting

### "Invalid private key format"
- Ensure it starts with `0x`
- Should be 66 characters total (0x + 64 hex chars)

### "Platform wallet not configured"
- Check `VITE_PLATFORM_WALLET_ADDRESS` is set correctly
- Verify it matches the private key

### "Insufficient balance for payout"
- Get more Sepolia ETH from faucet
- Check balance at https://sepolia.etherscan.io/

### "CoinGecko API rate limit"
- System will use fallback rate (250,000 INR)
- Try again in a few minutes

---

## Next Steps

Once you've added `VITE_PLATFORM_WALLET_ADDRESS`:

1. ✅ Subtask 1: Exchange Rate System (DONE)
2. ⏭️ Subtask 2: Update User Schema (NEXT)
   - Add wallet fields to profiles table
   - Create database migration

**Ready to proceed?** Confirm you've added the wallet address!
