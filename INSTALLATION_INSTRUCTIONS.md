# Installation Instructions for Payout Workflow

## 1. Install Required Dependencies

Run the following command to install ethers.js for Ethereum blockchain integration:

```bash
npm install ethers@6
```

## 2. Run Database Migrations

Apply the new database migrations to add the transactions table and update the items table:

```bash
# If using Supabase CLI locally
supabase db reset

# Or apply migrations manually in Supabase Dashboard:
# - Go to SQL Editor
# - Run the contents of:
#   - supabase/migrations/20251109042000_create_transactions_table.sql
#   - supabase/migrations/20251109042100_update_items_for_payout.sql
```

## 3. Regenerate Supabase Types

After running migrations, regenerate TypeScript types:

```bash
# If using Supabase CLI
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Or manually update the types in src/integrations/supabase/types.ts
```

## 4. Set Environment Variables

Add the following to your `.env` file:

```env
# Sepolia Testnet RPC URL (you can use public RPC or Infura/Alchemy)
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Platform's private key for sending ETH payouts (KEEP THIS SECRET!)
# Generate a new wallet for testing: https://vanity-eth.tk/
VITE_PLATFORM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Note: For production, use a secure key management service
```

## 5. Get Sepolia Test ETH

To test ETH payouts, you need Sepolia testnet ETH:

1. Get your platform wallet address by running the app
2. Visit a Sepolia faucet:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
3. Request test ETH for your platform wallet

## 6. Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

- Never commit your private key to version control
- Use environment variables for sensitive data
- For production, use a hardware wallet or key management service (AWS KMS, HashiCorp Vault)
- The platform wallet needs sufficient ETH balance for payouts + gas fees
- Consider implementing multi-signature wallets for large transactions
- Add rate limiting and monitoring for payout transactions

## 7. Testing the Workflow

1. Create a test item as a seller
2. Set payout method to "SEPOLIA_ETH" and provide an Ethereum address
3. As an official, process the item and approve payout
4. Check the transaction on Sepolia Etherscan: https://sepolia.etherscan.io/

## 8. Troubleshooting

**TypeScript Errors:**
- Run `npm run build` to check for type errors
- Regenerate Supabase types if you see "Property does not exist" errors

**Blockchain Errors:**
- Ensure platform wallet has sufficient Sepolia ETH
- Check RPC URL is accessible
- Verify private key format (should start with 0x)

**Database Errors:**
- Ensure migrations are applied in order
- Check RLS policies allow officials to create transactions
