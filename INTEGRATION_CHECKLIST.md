# Crypto Integration Checklist

## ✅ Completed Components

- [x] `cryptoTransactionService.ts` - All MetaMask & conversion functions
- [x] `cryptoVerificationService.ts` - Wallet verification & validation
- [x] `DualCurrencyDisplay.tsx` - 4 display variants
- [x] `CryptoPayoutDialog.tsx` - Official payout dialog
- [x] `CryptoBuyerDialog.tsx` - Buyer payment dialog
- [x] `WalletInput.tsx` - MetaMask connection (already existed)
- [x] `useCryptoVerification.ts` - React hooks
- [x] `Auth.tsx` - Wallet input in signup (already integrated)
- [x] `SellItemForm.tsx` - Dual currency display (already integrated)
- [x] Database migration - Wallet fields added
- [x] Documentation - Complete guides created

---

## ⏳ Remaining Integration Work

### 1. PendingItems.tsx - Add Crypto Payout Dialog

**Location**: `src/components/official/PendingItems.tsx`

**What to Add**:
```typescript
// At top with other imports
import { CryptoPayoutDialog } from "@/components/official/CryptoPayoutDialog";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";

// In component state (around line 41)
const [cryptoPayoutOpen, setCryptoPayoutOpen] = useState(false);
const [selectedItemForPayout, setSelectedItemForPayout] = useState<Item | null>(null);

// In handleApprove function (when processing item)
if (selectedItem?.payout_method === "SEPOLIA_ETH") {
  setSelectedItemForPayout(selectedItem);
  setCryptoPayoutOpen(true);
} else {
  // Existing INR payout logic
}

// In JSX - Display dual currency for seller's asking price
// Replace existing price display with:
<DualCurrencyDisplay 
  amountInr={item.seller_quoted_price} 
  variant="inline" 
/>

// At end of component JSX (before closing div)
<CryptoPayoutDialog
  open={cryptoPayoutOpen}
  onOpenChange={setCryptoPayoutOpen}
  sellerWallet={selectedItemForPayout?.seller_eth_address}
  payoutAmount={finalPayout}
  itemId={selectedItemForPayout?.id}
  onPayoutComplete={(txHash) => {
    // Update item status and transaction record
    updateItemStatus(selectedItemForPayout?.id, "payout_complete", txHash);
    setCryptoPayoutOpen(false);
  }}
/>
```

**Estimated Time**: 20 minutes

---

### 2. BrowseItems.tsx - Add Crypto Buyer Dialog

**Location**: `src/components/user/BrowseItems.tsx`

**What to Add**:
```typescript
// At top with other imports
import { CryptoBuyerDialog } from "@/components/user/CryptoBuyerDialog";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { useCryptoVerification } from "@/hooks/useCryptoVerification";

// In component
const { isVerified } = useCryptoVerification();

// In component state
const [cryptoBuyerOpen, setCryptoBuyerOpen] = useState(false);
const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<Item | null>(null);

// In handlePurchase function
if (paymentMethod === "SEPOLIA_ETH") {
  if (!isVerified) {
    toast.error("Please verify your wallet to use crypto payments");
    return;
  }
  setSelectedItemForPurchase(item);
  setCryptoBuyerOpen(true);
} else {
  // Existing INR payment logic
}

// In JSX - Display dual currency for selling price
// Replace existing price display with:
<DualCurrencyDisplay 
  amountInr={item.selling_price} 
  variant="inline" 
/>

// At end of component JSX
<CryptoBuyerDialog
  open={cryptoBuyerOpen}
  onOpenChange={setCryptoBuyerOpen}
  companyWallet={COMPANY_WALLET_ADDRESS}
  purchaseAmount={selectedItemForPurchase?.selling_price || 0}
  itemId={selectedItemForPurchase?.id || ""}
  itemName={selectedItemForPurchase?.category || ""}
  onPaymentComplete={(txHash) => {
    // Update item status and transaction record
    updateItemStatus(selectedItemForPurchase?.id, "sold", txHash);
    setCryptoBuyerOpen(false);
  }}
/>
```

**Estimated Time**: 20 minutes

---

### 3. Financials.tsx - Add Dual Currency Display

**Location**: `src/components/official/Financials.tsx`

**What to Add**:
```typescript
// At top with other imports
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { EXCHANGE_RATE } from "@/services/cryptoTransactionService";

// Add exchange rate display card (at top of financials)
<div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-6">
  <p className="text-sm font-semibold text-blue-900 mb-2">Exchange Rate</p>
  <p className="text-2xl font-bold text-blue-900">
    1 ETH = ₹{EXCHANGE_RATE.toLocaleString('en-IN')}
  </p>
</div>

// Replace existing revenue/cost/profit displays with:
<div className="space-y-4">
  <div>
    <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
    <DualCurrencyDisplay
      amountInr={totalRevenue}
      variant="breakdown"
    />
  </div>
  <div>
    <p className="text-sm text-muted-foreground mb-2">Total Cost</p>
    <DualCurrencyDisplay
      amountInr={totalCost}
      variant="breakdown"
    />
  </div>
  <div>
    <p className="text-sm text-muted-foreground mb-2">Net Profit</p>
    <DualCurrencyDisplay
      amountInr={netProfit}
      variant="breakdown"
    />
  </div>
</div>
```

**Estimated Time**: 15 minutes

---

### 4. AuditLogs.tsx - Add Dual Currency Display

**Location**: `src/components/official/AuditLogs.tsx`

**What to Add**:
```typescript
// At top with other imports
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";

// In transaction table, replace price displays with:
<DualCurrencyDisplay 
  amountInr={log.seller_quoted_price} 
  variant="inline" 
/>

<DualCurrencyDisplay 
  amountInr={log.final_payout} 
  variant="inline" 
/>

<DualCurrencyDisplay 
  amountInr={log.selling_price} 
  variant="inline" 
/>

<DualCurrencyDisplay 
  amountInr={log.repair_cost} 
  variant="inline" 
/>

<DualCurrencyDisplay 
  amountInr={log.recycle_cost} 
  variant="inline" 
/>

<DualCurrencyDisplay 
  amountInr={log.scrap_cost} 
  variant="inline" 
/>
```

**Estimated Time**: 15 minutes

---

## 🔧 Setup Steps

### Step 1: Install Dependencies
```bash
npm install ethers@6
```
**Time**: 2 minutes

### Step 2: Run Database Migration
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Copy contents of: `supabase/migrations/20251110_add_crypto_wallet_to_profiles.sql`
5. Paste into editor
6. Click "Run"
7. Verify success

**Time**: 5 minutes

### Step 3: Regenerate Supabase Types
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```
**Time**: 2 minutes

### Step 4: Update Environment Variables
Add to `.env`:
```env
VITE_COMPANY_WALLET_ADDRESS=0x... # Your MetaMask wallet on Sepolia
```
**Time**: 2 minutes

### Step 5: Get Sepolia Test ETH
1. Go to https://sepoliafaucet.com/
2. Enter your MetaMask wallet address
3. Click "Send me ETH"
4. Wait for confirmation

**Time**: 5 minutes

---

## 🧪 Testing Steps

### Test 1: User Registration
1. Go to signup page
2. Click "User Login"
3. Click "Sign Up" tab
4. Fill in name, email, password
5. Click "🦊 Connect MetaMask"
6. Approve MetaMask connection
7. Select account from dropdown
8. Click "Create Account"
9. Verify wallet saved in database

**Time**: 5 minutes

### Test 2: Seller Workflow
1. Login as user
2. Go to "Sell Items"
3. Fill in category, condition, price (e.g., 5000)
4. Verify dual currency shows: "₹5,000 / 0.02 ETH"
5. Select payout method: "Sepolia ETH"
6. Upload photo (optional)
7. Click "Submit Item"
8. Verify item created in database

**Time**: 5 minutes

### Test 3: Official Approval
1. Login as official
2. Go to "Pending Items"
3. Click on item
4. Set final payout: 4500
5. Select decision: "Refurbish"
6. Click "Approve & Process"
7. Verify crypto payout dialog opens
8. Click "Send ETH"
9. Approve in MetaMask
10. Verify transaction hash recorded

**Time**: 10 minutes

### Test 4: Buyer Purchase
1. Login as different user (buyer)
2. Go to "Browse Items"
3. See item with dual currency price
4. Click "Buy Now"
5. Select payment method: "Sepolia ETH"
6. Click "Pay with ETH"
7. Verify crypto buyer dialog opens
8. Click "Pay with ETH"
9. Approve in MetaMask
10. Verify transaction hash recorded

**Time**: 10 minutes

### Test 5: Financials Display
1. Login as official
2. Go to "Financials"
3. Verify exchange rate displayed: "1 ETH = ₹250,000"
4. Verify revenue in dual currency
5. Verify cost in dual currency
6. Verify profit in dual currency

**Time**: 5 minutes

### Test 6: Audit Logs
1. Login as official
2. Go to "Audit Logs"
3. Verify all prices shown in dual currency
4. Verify transaction hashes visible

**Time**: 5 minutes

---

## 📋 Final Checklist

### Setup
- [ ] Install ethers.js
- [ ] Run database migration
- [ ] Regenerate Supabase types
- [ ] Update .env with company wallet
- [ ] Get Sepolia test ETH

### Component Integration
- [ ] Update PendingItems.tsx
- [ ] Update BrowseItems.tsx
- [ ] Update Financials.tsx
- [ ] Update AuditLogs.tsx

### Testing
- [ ] Test user registration with MetaMask
- [ ] Test seller item submission
- [ ] Test official crypto payout
- [ ] Test buyer crypto payment
- [ ] Test financials display
- [ ] Test audit logs display

### Deployment
- [ ] Build project: `npm run build`
- [ ] Test locally: `npm run dev`
- [ ] Deploy to Lovable
- [ ] Configure environment variables

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Setup (install, migrate, env) | 20 min |
| PendingItems.tsx integration | 20 min |
| BrowseItems.tsx integration | 20 min |
| Financials.tsx integration | 15 min |
| AuditLogs.tsx integration | 15 min |
| Testing | 40 min |
| **Total** | **2.5 hours** |

---

## 📞 Support

- **Documentation**: See `CRYPTO_IMPLEMENTATION_GUIDE.md`
- **Quick Reference**: See `CRYPTO_QUICK_REFERENCE.md`
- **Summary**: See `CRYPTO_IMPLEMENTATION_SUMMARY.md`

---

## 🎉 You're Ready!

All the hard work is done. Just follow this checklist and you'll have a complete crypto transaction system! 🚀
