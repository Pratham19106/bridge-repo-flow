# Crypto Implementation - Quick Reference

## 🎯 Key Files Created

| File | Purpose |
|------|---------|
| `src/services/cryptoTransactionService.ts` | Main crypto operations (MetaMask, conversions) |
| `src/services/cryptoVerificationService.ts` | Wallet verification & validation |
| `src/components/ui/DualCurrencyDisplay.tsx` | Display amounts in INR + ETH |
| `src/components/user/WalletInput.tsx` | MetaMask connection UI (signup) |
| `src/components/official/CryptoPayoutDialog.tsx` | Official initiates seller payout |
| `src/components/user/CryptoBuyerDialog.tsx` | Buyer pays for item |
| `src/hooks/useCryptoVerification.ts` | Hooks for crypto verification |
| `supabase/migrations/20251110_add_crypto_wallet_to_profiles.sql` | Database schema |

## 🔄 Exchange Rate

**1 ETH = ₹250,000** (Global constant)

```typescript
import { EXCHANGE_RATE, convertInrToEth, convertEthToInr } from "@/services/cryptoTransactionService";

const eth = convertInrToEth(5000);  // 5000 INR → 0.02 ETH
const inr = convertEthToInr(0.02);  // 0.02 ETH → 5000 INR
```

## 📱 User Registration Flow

```typescript
// In Auth.tsx - Signup form
import { WalletInput } from "@/components/user/WalletInput";

<WalletInput
  value={walletAddress}
  onChange={setWalletAddress}
  onValidate={setIsWalletValid}
  disabled={loading}
  showHelp={true}
/>

// On signup success
await supabase
  .from("profiles")
  .update({
    wallet_address: walletAddress,
    is_crypto_verified: true,
  })
  .eq("id", user.id);
```

## 💰 Seller Payout (Official)

```typescript
import { CryptoPayoutDialog } from "@/components/official/CryptoPayoutDialog";

// In PendingItems.tsx
const [cryptoPayoutOpen, setCryptoPayoutOpen] = useState(false);

<CryptoPayoutDialog
  open={cryptoPayoutOpen}
  onOpenChange={setCryptoPayoutOpen}
  sellerWallet={item.seller_eth_address}
  payoutAmount={finalPayout}
  itemId={item.id}
  onPayoutComplete={(txHash) => {
    // Update database with transaction hash
    updateItemStatus(item.id, "payout_complete", txHash);
  }}
/>
```

## 🛒 Buyer Payment

```typescript
import { CryptoBuyerDialog } from "@/components/user/CryptoBuyerDialog";

// In BrowseItems.tsx
const [cryptoBuyerOpen, setCryptoBuyerOpen] = useState(false);

<CryptoBuyerDialog
  open={cryptoBuyerOpen}
  onOpenChange={setCryptoBuyerOpen}
  companyWallet={COMPANY_WALLET_ADDRESS}
  purchaseAmount={item.selling_price}
  itemId={item.id}
  itemName={item.category}
  onPaymentComplete={(txHash) => {
    // Update database with transaction hash
    updateItemStatus(item.id, "sold", txHash);
  }}
/>
```

## 💵 Dual Currency Display

```typescript
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";

// Default (stacked)
<DualCurrencyDisplay amountInr={5000} />
// Output: ₹5,000.00
//         0.02 ETH

// Inline
<DualCurrencyDisplay amountInr={5000} variant="inline" />
// Output: ₹5,000.00 / 0.02 ETH

// Badge
<DualCurrencyDisplay amountInr={5000} variant="badge" />
// Output: [₹5,000.00 / 0.02 ETH]

// Breakdown
<DualCurrencyDisplay amountInr={5000} variant="breakdown" />
// Output: ₹5,000.00
//         0.02 ETH
```

## 🔐 Wallet Verification

```typescript
import { 
  isValidEthereumAddress,
  isCryptoVerified,
  getUserWallet,
  canPerformCryptoTransaction
} from "@/services/cryptoVerificationService";

// Validate address format
const valid = isValidEthereumAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f42e1");

// Check if user is verified
const verified = await isCryptoVerified(userId);

// Get user's wallet
const wallet = await getUserWallet(userId);

// Check if user can do crypto transactions
const canDoCrypto = await canPerformCryptoTransaction(userId);
```

## 🪝 Crypto Verification Hook

```typescript
import { useCryptoVerification, useUserWallet } from "@/hooks/useCryptoVerification";

// In component
const { isVerified, walletAddress, message, loading } = useCryptoVerification();

if (!isVerified) {
  return <Alert>{message}</Alert>;
}

// Get wallet address
const { wallet, loading } = useUserWallet();
```

## 🔌 MetaMask Integration

```typescript
import {
  isMetaMaskInstalled,
  connectMetaMask,
  sendEthTransaction,
  getCurrentAccount,
  getWalletBalance,
  switchToSepolia
} from "@/services/cryptoTransactionService";

// Check if installed
if (!isMetaMaskInstalled()) {
  toast.error("MetaMask not installed");
}

// Connect wallet
const account = await connectMetaMask();

// Send transaction
const txHash = await sendEthTransaction(
  recipientAddress,
  0.02,  // ETH amount
  "Payment description"
);

// Get balance
const balance = await getWalletBalance(account);

// Switch to Sepolia
await switchToSepolia();
```

## 📊 Database Schema

### profiles table (additions)
```sql
wallet_address TEXT          -- Sepolia wallet (42 chars, 0x...)
is_crypto_verified BOOLEAN   -- Verification flag
```

### items table (additions)
```sql
payout_method TEXT           -- 'INR' or 'SEPOLIA_ETH'
seller_eth_address TEXT      -- Seller's wallet for ETH payout
```

### transactions table (new)
```sql
payout_amount_inr DECIMAL
payout_amount_eth DECIMAL
currency_conversion_rate DECIMAL
blockchain_tx_hash TEXT
from_address TEXT
to_address TEXT
gas_used DECIMAL
gas_price_gwei DECIMAL
status TEXT                  -- 'pending', 'processing', 'complete', 'failed'
```

## 🧪 Testing Commands

```bash
# Install dependencies
npm install ethers@6

# Run database migration
# Go to Supabase SQL Editor and run:
# supabase/migrations/20251110_add_crypto_wallet_to_profiles.sql

# Regenerate types
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Start dev server
npm run dev

# Build for production
npm run build
```

## ⚙️ Environment Variables

```env
# Sepolia Testnet
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_BLOCK_EXPLORER=https://sepolia.etherscan.io

# Company Wallet
VITE_COMPANY_WALLET_ADDRESS=0x...
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| MetaMask not detected | Install MetaMask extension, refresh page |
| Wallet not verified | Check address format (42 chars, 0x...) |
| Transaction failed | Check Sepolia balance, verify recipient |
| Dual currency not showing | Ensure price is entered, check console |
| Type errors | Run `supabase gen types typescript --local` |

## 📋 Integration Checklist

- [ ] Install ethers.js v6
- [ ] Run database migration
- [ ] Regenerate Supabase types
- [ ] Update .env with company wallet
- [ ] Get Sepolia test ETH
- [ ] Update Auth.tsx with WalletInput
- [ ] Update SellItemForm with dual currency
- [ ] Update PendingItems with CryptoPayoutDialog
- [ ] Update BrowseItems with CryptoBuyerDialog
- [ ] Update Financials with dual currency
- [ ] Update AuditLogs with dual currency
- [ ] Test user signup with MetaMask
- [ ] Test seller payout
- [ ] Test buyer payment
- [ ] Deploy to production

## 📞 Support

For detailed information, see: `CRYPTO_IMPLEMENTATION_GUIDE.md`
