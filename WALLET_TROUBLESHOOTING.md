# Wallet & Crypto Troubleshooting Guide

**Last Updated**: November 10, 2025

---

## 🔴 Common Issues & Solutions

### Issue 1: "Error fetching wallet: Object"

**Cause**: Browser extension (MetaMask, etc.) interfering with wallet fetch

**Solution**:
1. Check browser console for actual error message (now improved)
2. Look for error like: "Error fetching wallet: [actual message]"
3. Common causes:
   - Wallet not connected
   - Profile doesn't exist yet
   - RLS policy blocking access

**Fix Applied**:
- ✅ Better error logging (shows actual error message)
- ✅ Graceful fallback (sets wallet to null instead of crashing)
- ✅ No toast notification on first load (wallet might not be set yet)

---

### Issue 2: Wallet Address Not Saving on Signup

**Cause**: RLS policy didn't allow INSERT on profiles table

**Solution**:
1. Run migration: `20251110_fix_rls_policies.sql`
2. This adds INSERT policy for users
3. Verify in Supabase: profiles table should have wallet_address populated

**Fix Applied**:
- ✅ Added INSERT policy for users
- ✅ Added 500ms delay before update (ensures profile exists)
- ✅ Verification check after save (confirms wallet was saved)

---

### Issue 3: "Transaction rejected by user"

**Cause**: User clicked "Cancel" in MetaMask popup

**Solution**:
- This is expected behavior
- User can try again
- Check MetaMask is unlocked and on Sepolia network

**Fix Applied**:
- ✅ Proper error code handling (4001 = user rejection)
- ✅ User-friendly error message

---

### Issue 4: "No account connected"

**Cause**: MetaMask not connected or no accounts available

**Solution**:
1. Open MetaMask extension
2. Make sure you're logged in
3. Make sure you have at least one account
4. Click "Connect" if prompted
5. Refresh the page

**Fix Applied**:
- ✅ Auto-requests accounts if none connected
- ✅ Better error message

---

### Issue 5: "Invalid recipient wallet address"

**Cause**: Seller wallet or company wallet is invalid

**Solution**:
1. Check wallet address format (should be 42 chars, start with 0x)
2. For seller payout: Check `items.seller_eth_address` in database
3. For buyer payment: Check `VITE_COMPANY_WALLET_ADDRESS` in .env

**Fix Applied**:
- ✅ Wallet address validation before transaction
- ✅ Clear error message

---

### Issue 6: "Internal JSON-RPC error"

**Cause**: MetaMask connection issue or network problem

**Solution**:
1. Check you're on Sepolia testnet (not mainnet)
2. Restart MetaMask extension
3. Refresh the page
4. Try again

**Fix Applied**:
- ✅ Specific error code handling (-32603)
- ✅ User-friendly error message

---

## 🔧 Setup Checklist

### Before Testing Crypto Features

- [ ] MetaMask installed in browser
- [ ] MetaMask logged in
- [ ] MetaMask switched to Sepolia testnet
- [ ] MetaMask has at least 0.1 Sepolia ETH
- [ ] Database migration `20251110_fix_rls_policies.sql` run
- [ ] `.env` has `VITE_COMPANY_WALLET_ADDRESS` set
- [ ] User signed up with MetaMask wallet
- [ ] User's wallet address visible in Supabase profiles table

### Get Sepolia Test ETH

1. Go to https://sepoliafaucet.com/
2. Enter your MetaMask wallet address
3. Click "Send me ETH"
4. Wait for confirmation (usually instant)
5. Check MetaMask balance increased

---

## 🧪 Testing Steps

### Test 1: Wallet Saves on Signup

1. Go to signup page
2. Click "User Login"
3. Go to "Sign Up" tab
4. Click "🦊 Connect MetaMask"
5. Approve connection
6. Select account from dropdown
7. Fill in form (name, email, password)
8. Click "Create Account"
9. Check browser console:
   - Should see: `✓ Wallet saved successfully: 0x...`
   - Should see: `Account created with wallet verified!` toast
10. Go to Supabase → profiles table
11. Find your user → check `wallet_address` is populated ✓

### Test 2: Wallet Loads in SellItemForm

1. Login as user
2. Go to "Sell Items"
3. Check browser console:
   - Should see: `✓ Wallet loaded: 0x...`
4. Select "Sepolia ETH" payout method
5. Should see wallet address with green checkmark ✓

### Test 3: Seller Payout Transaction

1. Login as official
2. Go to "Pending Items"
3. Click on item from seller with ETH payout
4. Set final payout amount
5. Click "Approve & Process"
6. Click "Send ETH" button
7. MetaMask popup appears
8. Click "Confirm" in MetaMask
9. Check browser console:
   - Should see transaction hash
   - Should see success message
10. Check Supabase → transactions table
11. New record should exist with `blockchain_tx_hash` ✓

### Test 4: Buyer Payment Transaction

1. Login as buyer
2. Go to "Browse Items"
3. Select item
4. Choose "Sepolia ETH" payment
5. Click "Pay with ETH"
6. MetaMask popup appears
7. Click "Confirm" in MetaMask
8. Check browser console:
   - Should see transaction hash
   - Should see success message
9. Check Supabase → transactions table
10. New record should exist with `blockchain_tx_hash` ✓

---

## 📊 Browser Console Logs

### Expected Logs on Signup

```
✓ Wallet saved successfully: 0x742d35Cc...
Account created with wallet verified!
```

### Expected Logs in SellItemForm

```
✓ Wallet loaded: 0x742d35Cc...
```

### Expected Logs on Transaction

```
Payout sent! Hash: 0x1234567890...
✓ Transaction recorded in database
```

### Error Logs (Should Show Actual Error)

```
Error fetching wallet: PGRST116 The object requested in the URL does not exist
Error updating wallet: Invalid wallet address format
Wallet fetch error: Network error
```

---

## 🔐 Security Checklist

- ✅ No private keys stored in code
- ✅ All transactions signed by user's MetaMask
- ✅ Wallet address validated (42 chars, 0x format)
- ✅ RLS policies protect database access
- ✅ Error messages don't expose sensitive data
- ✅ Transaction hashes recorded for audit trail

---

## 📞 Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Wallet not loading | Refresh page, check MetaMask is connected |
| Transaction fails | Check Sepolia balance, check network is Sepolia |
| Wallet address null | Run RLS migration, sign up again |
| Error in console | Check actual error message (now improved) |
| MetaMask popup doesn't appear | Check MetaMask is unlocked, refresh page |

---

## 🚀 Production Checklist

Before going live:
- [ ] All error messages are user-friendly
- [ ] Wallet validation works correctly
- [ ] Transaction recording works
- [ ] RLS policies are correct
- [ ] Environment variables set correctly
- [ ] Tested on Sepolia testnet
- [ ] Tested with multiple wallets
- [ ] Error handling covers all cases
- [ ] Console logs are helpful for debugging
- [ ] No sensitive data in error messages

---

## 📝 Summary

All wallet and crypto errors now have:
✅ Better error logging (shows actual error message)
✅ Graceful error handling (doesn't crash)
✅ User-friendly error messages
✅ Proper validation before transactions
✅ Comprehensive troubleshooting guide

If you encounter any issues, check the console logs first - they now show the actual error message! 🎉
