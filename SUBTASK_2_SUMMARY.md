# SUBTASK 2: Update User Schema - COMPLETED ✅

## Overview
Successfully added crypto wallet fields to the user profiles table with validation, verification, and management services.

---

## Files Created

### 1. Database Migration
**File**: `supabase/migrations/20251110_add_crypto_wallet_to_profiles.sql`

**Changes to `profiles` table**:
```sql
-- New columns
wallet_address TEXT          -- Ethereum wallet address (42 chars, format: 0x...)
is_crypto_verified BOOLEAN   -- Verification flag (default: false)

-- Constraints
CHECK wallet_address format  -- Must be valid Ethereum address
UNIQUE wallet_address        -- Each wallet used only once

-- Indexes
idx_profiles_wallet_address  -- Fast wallet lookups
idx_profiles_crypto_verified -- Fast verification status queries
```

**RLS Policies Updated**:
- Users can update their own wallet
- Officials can view all wallet addresses for transactions

---

### 2. Backend Service
**File**: `src/services/walletService.ts` (200+ lines)

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `isValidEthereumAddress()` | Validates address format (42 chars, 0x...) |
| `getUserWalletProfile()` | Fetch user's wallet data |
| `updateUserWallet()` | Update and verify wallet address |
| `verifyUserWallet()` | Verify wallet format |
| `removeUserWallet()` | Remove wallet from profile |
| `hasVerifiedWallet()` | Check if user has verified wallet |
| `getUserWalletAddress()` | Get user's wallet address |
| `formatWalletAddress()` | Format for display (0x1234...5678) |
| `validateWalletForTransaction()` | Check if wallet is eligible for transactions |

**Features**:
- ✅ Ethereum address format validation (regex: `^0x[a-fA-F0-9]{40}$`)
- ✅ Duplicate wallet prevention
- ✅ Automatic verification on valid format
- ✅ Comprehensive error messages
- ✅ Transaction eligibility checks

---

### 3. React Hook
**File**: `src/hooks/useWallet.ts` (200+ lines)

**Hook Features**:
- Auto-fetches wallet profile on mount
- Handles loading/error states
- Provides wallet management methods

**Available Methods**:
```typescript
const {
  // State
  walletAddress,      // User's wallet address
  isVerified,         // Verification status
  loading,            // Loading state
  error,              // Error message

  // Methods
  updateWallet,       // Update wallet address
  verifyWallet,       // Verify wallet
  removeWallet,       // Remove wallet
  checkVerified,      // Check if verified
  getAddress,         // Get wallet address
  formatAddress,      // Format for display
  validateForTransaction, // Check transaction eligibility
} = useWallet();
```

---

## Database Schema

### Updated `profiles` Table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  
  -- NEW: Crypto wallet fields
  wallet_address TEXT,          -- Ethereum address (42 chars)
  is_crypto_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_wallet_address_format CHECK (
    wallet_address IS NULL OR (
      wallet_address ~ '^0x[a-fA-F0-9]{40}$' AND 
      length(wallet_address) = 42
    )
  ),
  CONSTRAINT unique_wallet_address UNIQUE (wallet_address)
);

-- Indexes
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX idx_profiles_crypto_verified ON public.profiles(is_crypto_verified);
```

---

## Validation Rules

### Ethereum Address Format
- **Length**: Exactly 42 characters
- **Prefix**: Must start with `0x`
- **Characters**: 40 hexadecimal characters (0-9, a-f, A-F)
- **Example**: `0x1234567890123456789012345678901234567890`

### Verification Process
1. User enters wallet address
2. System validates format using regex
3. If valid → `is_crypto_verified = true`
4. If invalid → Error message, `is_crypto_verified = false`

### Transaction Eligibility
User can participate in crypto transactions only if:
- ✅ `wallet_address` is set
- ✅ `is_crypto_verified = true`
- ✅ Address format is valid

---

## Usage Examples

### Update User's Wallet

```typescript
import { useWallet } from "@/hooks/useWallet";

function WalletSetup() {
  const { updateWallet, loading, error } = useWallet();

  const handleAddWallet = async () => {
    const success = await updateWallet("0x1234567890123456789012345678901234567890");
    
    if (success) {
      console.log("Wallet added and verified!");
    } else {
      console.log("Error:", error);
    }
  };

  return (
    <button onClick={handleAddWallet} disabled={loading}>
      {loading ? "Adding..." : "Add Wallet"}
    </button>
  );
}
```

### Check Wallet Status

```typescript
function WalletStatus() {
  const { walletAddress, isVerified, formatAddress } = useWallet();

  return (
    <div>
      {walletAddress ? (
        <>
          <p>Wallet: {formatAddress(walletAddress)}</p>
          <p>Verified: {isVerified ? "✅ Yes" : "❌ No"}</p>
        </>
      ) : (
        <p>No wallet connected</p>
      )}
    </div>
  );
}
```

### Validate Before Transaction

```typescript
function PaymentComponent() {
  const { validateForTransaction } = useWallet();

  const handlePay = async () => {
    const validation = await validateForTransaction();
    
    if (!validation.valid) {
      alert(validation.message); // "Please add your MetaMask wallet..."
      return;
    }

    // Proceed with payment
  };

  return <button onClick={handlePay}>Pay with ETH</button>;
}
```

---

## Migration Instructions

### Step 1: Apply Migration

Run in Supabase SQL Editor:
```sql
-- Copy contents of:
-- supabase/migrations/20251110_add_crypto_wallet_to_profiles.sql
```

Or via CLI:
```bash
supabase db push
```

### Step 2: Regenerate Types

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Step 3: Verify

Check that `profiles` table now has:
- ✅ `wallet_address` column
- ✅ `is_crypto_verified` column
- ✅ Constraints and indexes

---

## Security Features

✅ **Format Validation** - Regex ensures valid Ethereum address  
✅ **Uniqueness** - Each wallet can only be used once  
✅ **RLS Policies** - Users can only update their own wallet  
✅ **Verification Flag** - Tracks validation status  
✅ **Transaction Guards** - Prevents non-verified users from crypto transactions  

---

## Error Handling

All functions return meaningful error messages:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid Ethereum address format" | Wrong format | Use valid 0x... address |
| "This wallet is already registered" | Duplicate wallet | Use different wallet |
| "User profile not found" | User doesn't exist | Check user ID |
| "No wallet address set" | Empty wallet field | Add wallet address |

---

## Testing

### Test 1: Validate Address Format

```typescript
import { isValidEthereumAddress } from "@/services/walletService";

// Valid
isValidEthereumAddress("0x1234567890123456789012345678901234567890"); // true

// Invalid
isValidEthereumAddress("1234567890123456789012345678901234567890");   // false (no 0x)
isValidEthereumAddress("0x123");                                      // false (too short)
```

### Test 2: Update Wallet

```typescript
const result = await updateUserWallet(userId, "0x1234567890123456789012345678901234567890");

console.log(result.success);  // true
console.log(result.data?.is_crypto_verified); // true
```

### Test 3: Transaction Validation

```typescript
const validation = await validateWalletForTransaction(userId);

console.log(validation.valid);    // true/false
console.log(validation.message);  // "Wallet is valid..." or error
```

---

## Next Steps

✅ **Subtask 1**: Exchange Rate System (DONE)  
✅ **Subtask 2**: Update User Schema (DONE)  
⏭️ **Subtask 3**: Create Wallet Verification Service

---

## Summary

**What was added**:
- 2 new columns to `profiles` table
- Format validation constraints
- Uniqueness constraints
- 2 performance indexes
- 9 wallet management functions
- React hook for easy integration
- Comprehensive error handling

**What's ready**:
- Users can add/update wallet addresses
- Automatic format validation
- Verification status tracking
- Transaction eligibility checks

**Status**: ✅ READY FOR SUBTASK 3
