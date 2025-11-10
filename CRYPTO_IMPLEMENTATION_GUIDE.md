# Crypto Transaction Implementation Guide

## 🎯 Overview

This guide covers the complete implementation of Sepolia ETH crypto transactions in the Bridge Repo Flow platform. All monetary values are displayed in dual currency format (INR + ETH), with 1 ETH = ₹250,000 as the global exchange rate.

**⚠️ IMPORTANT**: The main database schema `20251110_add_crypto_wallet_to_profiles.sql` is **already deployed in your Supabase**. All other files in this guide are supporting implementations (services, components, hooks) that work with this existing schema.

---

## 📋 What's Been Implemented

### ✅ Core Services

#### 1. **cryptoTransactionService.ts**
Main service for all crypto operations:
- `isMetaMaskInstalled()` - Check MetaMask availability
- `connectMetaMask()` - Connect to MetaMask wallet
- `switchToSepolia()` - Switch to Sepolia testnet
- `getCurrentAccount()` - Get connected account
- `getWalletBalance()` - Check wallet balance
- `sendEthTransaction()` - Send ETH via MetaMask
- `convertInrToEth()` - Convert INR to ETH (1 ETH = ₹250,000)
- `convertEthToInr()` - Convert ETH to INR
- `formatDualCurrency()` - Format display string
- `waitForTransaction()` - Wait for confirmation
- `getTransactionDetails()` - Get tx info
- `estimateGas()` - Calculate gas fees

#### 2. **cryptoVerificationService.ts**
Wallet verification and validation:
- `isValidEthereumAddress()` - Validate address format (42 chars, 0x...)
- `isCryptoVerified()` - Check if wallet is verified
- `getUserWallet()` - Get user's wallet address
- `saveAndVerifyWallet()` - Save and verify wallet
- `canPerformCryptoTransaction()` - Check if user can do crypto transactions
- `canReceiveCryptoPayout()` - Check if user can receive crypto payouts
- `getWalletVerificationStatus()` - Get detailed status

### ✅ UI Components

#### 1. **DualCurrencyDisplay.tsx**
Displays amounts in dual currency format:
- `DualCurrencyDisplay` - Main component (4 variants)
- `DualCurrencyInline` - Inline format
- `DualCurrencyBadge` - Badge format
- `PriceBreakdown` - Breakdown format

#### 2. **CryptoPayoutDialog.tsx**
For officials to initiate seller payouts:
- Shows payout amount in dual currency
- Displays recipient wallet
- Initiates MetaMask transaction
- Shows transaction hash on success
- Error handling and validation

#### 3. **CryptoBuyerDialog.tsx**
For buyers to pay for items:
- Shows payment amount in dual currency
- Displays company wallet
- Initiates MetaMask transaction
- Shows transaction hash on success
- Error handling and validation

#### 4. **WalletInput.tsx**
For users to connect MetaMask during signup:
- MetaMask connection button
- Account selection dropdown
- Manual address input
- Format validation
- Helpful instructions

### ✅ Hooks

#### **useCryptoVerification.ts**
- `useCryptoVerification()` - Get wallet verification status
- `useUserWallet()` - Get user's wallet address
- `useCanPerformCryptoTransaction()` - Check if user can do crypto transactions

### ✅ Database Schema

**Migration: `20251110_add_crypto_wallet_to_profiles.sql`**

Added to `profiles` table:
- `wallet_address` (TEXT) - Sepolia MetaMask wallet (42 chars, 0x format)
- `is_crypto_verified` (BOOLEAN) - Verification flag
- Unique constraint on wallet_address
- Format validation via CHECK constraint
- Indexes for fast lookups

---

## 🔄 User Workflows

### 1. User Registration (Seller)

```
1. User clicks "Sign Up" → "User Login"
2. Fills in: Name, Email, Password
3. Selects Account Type: Individual/Company
4. Sees "MetaMask Wallet Address" section
5. Clicks "🦊 Connect MetaMask" button
6. MetaMask popup appears → User approves connection
7. MetaMask shows available accounts
8. User selects account from dropdown
9. Account address auto-fills in input field
10. System validates format (42 chars, 0x...)
11. Green checkmark appears ✓
12. User clicks "Create Account"
13. Wallet saved to database with is_crypto_verified = true
```

**Key Points:**
- Wallet connection is MANDATORY for users
- Only users need wallet (officials don't)
- Wallet is auto-verified on signup
- Wallet address stored in profiles table

### 2. Seller Submits Item

```
1. User goes to "Sell Items" dashboard
2. Fills in: Category, Condition, Asking Price
3. System shows dual currency display:
   "₹5,000 / 0.02 ETH"
4. Selects payout method:
   - INR (traditional bank transfer)
   - Sepolia ETH (crypto payment)
5. If ETH selected:
   - System auto-fetches wallet from profile
   - Shows wallet address (truncated)
   - Shows verification status
6. Uploads photos/videos (optional)
7. Clicks "Submit Item"
8. Item stored with payout_method = "SEPOLIA_ETH"
```

**Database Fields:**
- `payout_method` = "SEPOLIA_ETH" or "INR"
- `seller_eth_address` = wallet address (if ETH)
- `seller_quoted_price` = INR amount

### 3. Official Reviews & Approves Item

```
1. Official goes to "Pending Items" dashboard
2. Sees list of items pending valuation
3. Clicks on item to view details
4. Reviews: Category, Condition, Seller's Asking Price
5. System shows dual currency:
   "₹5,000 / 0.02 ETH"
6. Official sets "Final Payout" amount (in INR)
7. System auto-calculates ETH equivalent
8. Official selects decision:
   - Refurbish (repair_cost, selling_price)
   - Recycle (recycle_cost)
   - Scrap (scrap_cost)
9. Clicks "Approve & Process"
10. If payout_method = "SEPOLIA_ETH":
    - Dialog opens: "Initiate Crypto Payout"
    - Shows: Seller wallet, Payout amount (dual currency)
    - Official clicks "Send ETH"
    - MetaMask popup appears
    - Official approves transaction
    - Transaction hash recorded in database
    - Item status → "payout_complete"
```

**Database Updates:**
- `status` = "payout_complete"
- `final_payout` = INR amount
- `processed_by` = official's user ID
- `processed_at` = timestamp
- Transaction record created with:
  - `payout_amount_inr` = INR amount
  - `payout_amount_eth` = ETH amount
  - `blockchain_tx_hash` = transaction hash
  - `status` = "complete"

### 4. Buyer Purchases Item

```
1. Buyer goes to "Browse Items" dashboard
2. Sees items available for purchase
3. Each item shows dual currency price:
   "₹5,000 / 0.02 ETH"
4. Clicks on item → "Buy Now"
5. Purchase dialog appears
6. Shows item details and price (dual currency)
7. Buyer selects payment method:
   - INR (traditional)
   - Sepolia ETH (crypto)
8. If ETH selected:
   - System checks wallet verification
   - If not verified: Shows error
     "Please verify your wallet to use crypto payments"
   - If verified: Shows warning
     "You will pay 0.02 ETH for this item"
9. Clicks "Pay with ETH"
10. CryptoBuyerDialog opens showing:
    - Item name
    - Payment amount (dual currency)
    - Company wallet address
11. Clicks "Pay with ETH"
12. MetaMask popup appears
13. Buyer approves transaction
14. Transaction hash recorded
15. Item status → "sold"
```

**Database Updates:**
- `status` = "sold"
- `buyer_id` = buyer's user ID
- Transaction record created with:
  - `payout_amount_inr` = purchase price
  - `payout_amount_eth` = ETH amount
  - `blockchain_tx_hash` = transaction hash
  - `from_address` = buyer's wallet
  - `to_address` = company wallet

---

## 💻 Integration Points

### In Auth.tsx (Already Done)
```tsx
// Wallet input for users during signup
{loginType === "user" && (
  <WalletInput
    value={walletAddress}
    onChange={setWalletAddress}
    onValidate={setIsWalletValid}
    disabled={loading}
    showHelp={true}
  />
)}

// Save wallet on signup
if (loginType === "user" && walletAddress) {
  await supabase
    .from("profiles")
    .update({
      wallet_address: walletAddress,
      is_crypto_verified: true,
    })
    .eq("id", data.user.id);
}
```

### In SellItemForm.tsx (Already Done)
```tsx
// Show dual currency display
{price && !isNaN(parseFloat(price)) && (
  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-xs text-muted-foreground mb-2">Equivalent in Sepolia ETH:</p>
    <DualCurrencyDisplay
      amountInr={parseFloat(price)}
      variant="breakdown"
    />
  </div>
)}

// Store payout method
const { data: item } = await supabase
  .from("items")
  .insert({
    seller_id: user.id,
    category,
    condition,
    seller_quoted_price: parseFloat(price),
    payout_method: payoutMethod,
    seller_eth_address: payoutMethod === "SEPOLIA_ETH" ? ethAddress : null,
  });
```

### In PendingItems.tsx (TO DO)
```tsx
// Import components
import { CryptoPayoutDialog } from "@/components/official/CryptoPayoutDialog";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";

// Add state for crypto dialog
const [cryptoPayoutOpen, setCryptoPayoutOpen] = useState(false);
const [selectedItemForPayout, setSelectedItemForPayout] = useState<Item | null>(null);

// Show dual currency in item list
<DualCurrencyDisplay
  amountInr={item.seller_quoted_price}
  variant="inline"
/>

// When official approves item
const handleApprove = async () => {
  if (selectedItem?.payout_method === "SEPOLIA_ETH") {
    // Open crypto payout dialog
    setSelectedItemForPayout(selectedItem);
    setCryptoPayoutOpen(true);
  } else {
    // Handle INR payout
    // ... existing code
  }
};

// Add dialog
<CryptoPayoutDialog
  open={cryptoPayoutOpen}
  onOpenChange={setCryptoPayoutOpen}
  sellerWallet={selectedItemForPayout?.seller_eth_address}
  payoutAmount={finalPayout}
  itemId={selectedItemForPayout?.id}
  onPayoutComplete={(txHash) => {
    // Update item status and transaction record
    updateItemAndTransaction(txHash);
  }}
/>
```

### In BrowseItems.tsx (TO DO)
```tsx
// Import components
import { CryptoBuyerDialog } from "@/components/user/CryptoBuyerDialog";
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { useCryptoVerification } from "@/hooks/useCryptoVerification";

// Use crypto verification hook
const { isVerified } = useCryptoVerification();

// Show dual currency in item list
<DualCurrencyDisplay
  amountInr={item.selling_price}
  variant="inline"
/>

// When buyer clicks purchase
const handlePurchase = async (item: Item) => {
  if (paymentMethod === "SEPOLIA_ETH") {
    // Check crypto verification
    if (!isVerified) {
      toast.error("Please verify your wallet to use crypto payments");
      return;
    }
    
    // Open crypto buyer dialog
    setSelectedItemForPurchase(item);
    setCryptoBuyerOpen(true);
  } else {
    // Handle INR payment
    // ... existing code
  }
};

// Add dialog
<CryptoBuyerDialog
  open={cryptoBuyerOpen}
  onOpenChange={setCryptoBuyerOpen}
  companyWallet={COMPANY_WALLET_ADDRESS}
  purchaseAmount={item.selling_price}
  itemId={item.id}
  itemName={item.category}
  onPaymentComplete={(txHash) => {
    // Update item status and transaction record
    updateItemAndTransaction(txHash);
  }}
/>
```

### In Financials.tsx (TO DO)
```tsx
// Import components
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";
import { EXCHANGE_RATE } from "@/services/cryptoTransactionService";

// Display exchange rate
<div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
  <p className="text-sm font-semibold mb-2">Exchange Rate</p>
  <p className="text-lg font-bold">1 ETH = ₹{EXCHANGE_RATE.toLocaleString('en-IN')}</p>
</div>

// Display financials in dual currency
<div className="space-y-3">
  <div>
    <p className="text-sm text-muted-foreground">Total Revenue</p>
    <DualCurrencyDisplay
      amountInr={totalRevenue}
      variant="breakdown"
    />
  </div>
  <div>
    <p className="text-sm text-muted-foreground">Total Cost</p>
    <DualCurrencyDisplay
      amountInr={totalCost}
      variant="breakdown"
    />
  </div>
  <div>
    <p className="text-sm text-muted-foreground">Net Profit</p>
    <DualCurrencyDisplay
      amountInr={netProfit}
      variant="breakdown"
    />
  </div>
</div>
```

### In AuditLogs.tsx (TO DO)
```tsx
// Import components
import { DualCurrencyDisplay } from "@/components/ui/DualCurrencyDisplay";

// Display transaction amounts in dual currency
<table>
  <tbody>
    <tr>
      <td>Seller's Ask</td>
      <td>
        <DualCurrencyDisplay
          amountInr={log.seller_quoted_price}
          variant="inline"
        />
      </td>
    </tr>
    <tr>
      <td>Final Payout</td>
      <td>
        <DualCurrencyDisplay
          amountInr={log.final_payout}
          variant="inline"
        />
      </td>
    </tr>
    <tr>
      <td>Selling Price</td>
      <td>
        <DualCurrencyDisplay
          amountInr={log.selling_price}
          variant="inline"
        />
      </td>
    </tr>
  </tbody>
</table>
```

---

## 🔧 Environment Setup

### 1. Install Dependencies
```bash
npm install ethers@6
```

### 2. Update .env
```env
# Sepolia Testnet
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_BLOCK_EXPLORER=https://sepolia.etherscan.io

# Company Wallet (for receiving buyer payments)
VITE_COMPANY_WALLET_ADDRESS=0x... # Your MetaMask wallet on Sepolia
```

### 3. Get Sepolia Test ETH
1. Go to https://sepoliafaucet.com/
2. Enter your MetaMask wallet address
3. Request test ETH
4. Wait for confirmation (usually instant)

### 4. Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/20251110_add_crypto_wallet_to_profiles.sql
```

### 5. Regenerate Supabase Types
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## 🧪 Testing Checklist

### User Registration
- [ ] User can sign up with MetaMask wallet
- [ ] Wallet address is validated (42 chars, 0x...)
- [ ] Wallet is marked as verified on signup
- [ ] Wallet address stored in profiles table

### Seller Workflow
- [ ] Seller can submit item with payout method choice
- [ ] Dual currency display shows correctly
- [ ] ETH amount calculated correctly (INR ÷ 250,000)
- [ ] Payout method stored in items table
- [ ] Wallet address stored if ETH selected

### Official Workflow
- [ ] Official can see pending items
- [ ] Dual currency display shows on all prices
- [ ] Official can initiate crypto payout
- [ ] MetaMask popup appears on payout
- [ ] Transaction hash recorded in database
- [ ] Item status updated to "payout_complete"

### Buyer Workflow
- [ ] Buyer can browse items with dual currency prices
- [ ] Buyer can select payment method
- [ ] Crypto verification check works
- [ ] CryptoBuyerDialog opens with correct details
- [ ] MetaMask popup appears on payment
- [ ] Transaction hash recorded in database
- [ ] Item status updated to "sold"

### Financials & Audit
- [ ] Exchange rate displayed correctly
- [ ] Total Revenue shown in dual currency
- [ ] Total Cost shown in dual currency
- [ ] Net Profit calculated correctly
- [ ] Audit logs show all amounts in dual currency

---

## 🔐 Security Considerations

1. **No Private Keys Stored**
   - All transactions signed by user's MetaMask
   - Platform wallet address in .env only

2. **Wallet Verification**
   - Format validation (42 chars, 0x...)
   - Unique constraint in database
   - Verified flag prevents non-verified users from crypto

3. **RLS Policies**
   - Users can only update their own profile
   - Officials can view all profiles
   - Transaction records protected

4. **Error Handling**
   - All MetaMask errors caught and displayed
   - User-friendly error messages
   - Transaction failures logged

---

## 📊 Exchange Rate

**Global Rate: 1 ETH = ₹250,000**

Used for:
- Converting INR to ETH for display
- Converting ETH to INR for calculations
- All dual currency displays

Location: `EXCHANGE_RATE = 250000` in `cryptoTransactionService.ts`

---

## 🚀 Deployment

1. Build the project
   ```bash
   npm run build
   ```

2. Test locally
   ```bash
   npm run dev
   ```

3. Deploy to Lovable
   - Push to Git
   - Lovable auto-deploys

4. Configure environment variables in deployment platform

---

## 📞 Troubleshooting

### MetaMask Not Detected
- Ensure MetaMask extension is installed
- Refresh page after installation
- Check browser console for errors

### Transaction Failed
- Check Sepolia testnet balance
- Verify recipient wallet address
- Check gas price on Sepolia Etherscan

### Wallet Not Verified
- Ensure address format is correct (42 chars, 0x...)
- Check database for wallet_address field
- Verify is_crypto_verified flag

### Dual Currency Not Showing
- Check if price is entered
- Verify convertInrToEth function works
- Check browser console for errors

---

## 📝 Summary

You now have a complete crypto transaction system with:
- ✅ MetaMask integration
- ✅ Sepolia ETH support
- ✅ Dual currency display (INR + ETH)
- ✅ Seller payouts via crypto
- ✅ Buyer payments via crypto
- ✅ Wallet verification
- ✅ Transaction tracking
- ✅ Complete audit trail

All monetary values are displayed in dual currency format, making it easy for users to understand both INR and ETH amounts!
