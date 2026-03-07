# BidBlitz Token (BBZ) - Deployment Guide

## Smart Contract Details
- **Name:** BidBlitz
- **Symbol:** BBZ
- **Decimals:** 18
- **Total Supply:** 1,000,000,000 BBZ
- **Network:** BNB Smart Chain (BSC) Testnet

## Contract Address (After Deployment)
```
TESTNET: [To be filled after deployment]
MAINNET: [To be filled after deployment]
```

## Deployment Steps

### 1. Prerequisites
- MetaMask wallet with BNB Testnet configured
- Test BNB from faucet: https://testnet.bnbchain.org/faucet-smart

### 2. Using Remix IDE (Recommended)
1. Go to https://remix.ethereum.org
2. Create new file: `BidBlitzToken.sol`
3. Copy contract code from `/app/contracts/BidBlitzToken.sol`
4. Compile with Solidity 0.8.20
5. Deploy to BSC Testnet via MetaMask

### 3. Network Configuration
```
Network Name: BNB Smart Chain Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID: 97
Symbol: tBNB
Explorer: https://testnet.bscscan.com/
```

## Contract Functions

### Read Functions
- `name()` - Returns "BidBlitz"
- `symbol()` - Returns "BBZ"
- `decimals()` - Returns 18
- `totalSupply()` - Returns total token supply
- `balanceOf(address)` - Returns balance of address
- `allowance(owner, spender)` - Returns allowance

### Write Functions
- `transfer(to, amount)` - Transfer tokens
- `approve(spender, amount)` - Approve spending
- `transferFrom(from, to, amount)` - Transfer from approved
- `mint(to, amount)` - Mint new tokens (owner only)
- `burn(amount)` - Burn tokens
- `transferOwnership(newOwner)` - Transfer contract ownership
- `renounceOwnership()` - Renounce ownership

## Integration with BidBlitz App

### Backend Endpoint
```python
# /api/bbz/contract
{
    "network": "bsc_testnet",
    "contract_address": "0x...",
    "symbol": "BBZ",
    "decimals": 18
}
```

### Frontend Integration
```javascript
// Connect to contract
const contract = new ethers.Contract(BBZ_ADDRESS, BBZ_ABI, signer);

// Check balance
const balance = await contract.balanceOf(userAddress);

// Transfer tokens
await contract.transfer(recipient, ethers.parseEther("100"));
```

## Token Distribution Plan
| Allocation | Percentage | Amount |
|------------|------------|--------|
| Public Sale | 30% | 300,000,000 BBZ |
| Team & Advisors | 15% | 150,000,000 BBZ |
| Development Fund | 20% | 200,000,000 BBZ |
| Marketing | 10% | 100,000,000 BBZ |
| Liquidity Pool | 15% | 150,000,000 BBZ |
| Reserve | 10% | 100,000,000 BBZ |

## Security Notes
- Contract has been manually reviewed
- Consider professional audit before mainnet deployment
- Keep owner private key secure
- Use multisig for mainnet ownership
