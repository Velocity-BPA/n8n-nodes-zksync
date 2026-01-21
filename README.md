# n8n-nodes-zksync

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **zkSync Era** blockchain operations. This marketplace-ready toolkit enables seamless integration with zkSync Era's Layer 2 scaling solution, including native Account Abstraction, Paymasters for sponsored transactions, and L1↔L2 bridging.

![zkSync Era](https://img.shields.io/badge/zkSync-Era-blue)
![n8n](https://img.shields.io/badge/n8n-community%20node-orange)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **15 Resource Categories** with 100+ operations
- **Native Account Abstraction** - Deploy and manage smart accounts without ERC-4337
- **Paymaster Integration** - Sponsored/gasless transactions
- **L1↔L2 Bridging** - Deposit and withdraw assets between Ethereum and zkSync
- **Zero-Knowledge Proofs** - Access and verify ZK proofs
- **Real-time Triggers** - Monitor blocks, transactions, and contract events
- **Full TypeScript Support** - Type-safe implementations

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-zksync`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Install the package
npm install n8n-nodes-zksync
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-zksync.git
cd n8n-nodes-zksync

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n (for development)
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-zksync
```

## Credentials Setup

### zkSync Network Credentials

| Field | Description |
|-------|-------------|
| Network | Select mainnet, testnet (Sepolia), or custom |
| Private Key | Your wallet private key (keep secure!) |
| Custom RPC URL | Required if using custom network |

### zkSync Paymaster Credentials

| Field | Description |
|-------|-------------|
| Paymaster Type | Testnet (automatic) or Custom |
| Paymaster Address | Your custom paymaster contract |
| Gas Token Address | ERC-20 token for gas payment |

## Resources & Operations

### Account
- Get Balance
- Get Nonce
- Get Transaction Count
- Is Contract
- Get Code

### Transaction
- Send ETH
- Get Transaction
- Get Transaction Receipt
- Get Transaction Status
- Estimate Gas
- Get Gas Price

### Account Abstraction
- Get Account Type
- Get Deployment Nonce

### Paymaster
- Get Testnet Paymaster
- Build General Params
- Build Approval Params

### Token (ERC-20)
- Get Token Balance
- Get Token Info
- Transfer Tokens
- Approve Spending
- Get Allowance

### NFT (ERC-721)
- Get NFT Balance
- Get NFT Owner
- Get Token URI
- Transfer NFT

### Contract
- Read Contract
- Write Contract
- Get Contract Code

### Bridge
- Get Bridge Addresses
- Get L2 Token Address

### Block
- Get Block
- Get Latest Block
- Get Block Details
- Get L1 Batch Number
- Get L1 Batch Details

### Proof
- Get Transaction Proof
- Get Log Proof

### Fee
- Get Gas Price
- Get Fee Params
- Estimate Gas

### Events
- Get Logs

### L1 Interaction
- Get L1 Chain ID
- Get Main Contract
- Get Base Token

### System Contracts
- Get All System Contracts
- Get Contract Deployer
- Get Nonce Holder

### Utility
- Convert Units (wei/gwei/ETH)
- Validate Address
- Hash Data (Keccak256)
- Encode ABI
- Decode ABI
- Sign Message
- Generate Wallet

## Trigger Node

Monitor blockchain events in real-time:

| Trigger | Description |
|---------|-------------|
| New Block | Fires on each new L2 block |
| New L1 Batch | Fires when new L1 batch is submitted |
| Transaction Confirmed | Fires when a transaction reaches confirmations |
| ETH Received | Fires when address receives ETH |
| ETH Sent | Fires when address sends ETH |
| Token Transfer | Fires on ERC-20 transfers |
| NFT Transfer | Fires on NFT transfers |
| Contract Event | Fires on specific contract events |
| Block Finalized | Fires when block is proven on L1 |
| Balance Change | Fires when address balance changes |

## Usage Examples

### Send ETH with Paymaster (Gasless)

```javascript
// In n8n workflow:
// 1. Add zkSync node
// 2. Select "Transaction" resource
// 3. Select "Send ETH" operation
// 4. Enable "Use Paymaster" option
// 5. Configure recipient and amount
```

### Read Contract Data

```javascript
// 1. Add zkSync node
// 2. Select "Contract" resource
// 3. Select "Read Contract" operation
// 4. Provide contract address and ABI
// 5. Specify function name and arguments
```

### Monitor Token Transfers

```javascript
// 1. Add zkSync Trigger node
// 2. Select "Token Transfer" trigger
// 3. Provide contract address
// 4. Optionally filter by address
```

## zkSync Era Concepts

### Native Account Abstraction
zkSync Era implements native AA at the protocol level, meaning every account can have custom validation logic without needing ERC-4337 infrastructure.

### Paymasters
Paymasters allow third parties to pay for user transactions, enabling gasless experiences. zkSync supports general paymasters and approval-based paymasters for ERC-20 gas payment.

### L1 Batches
L2 blocks are grouped into L1 batches for efficient submission to Ethereum. Each batch goes through stages: Committed → Proven → Executed.

### Finality
- **Committed**: Batch data posted to L1
- **Proven**: ZK proof verified on L1
- **Executed**: State changes finalized on L1

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 324 | https://mainnet.era.zksync.io |
| Sepolia Testnet | 300 | https://sepolia.era.zksync.dev |

## Error Handling

The node includes comprehensive error handling:
- Invalid address validation
- Insufficient balance checks
- Gas estimation failures
- Network connectivity issues
- Transaction reverts with decoded reasons

## Security Best Practices

1. **Never expose private keys** - Use n8n credentials securely
2. **Validate addresses** - Always validate input addresses
3. **Test on Sepolia first** - Use testnet before mainnet
4. **Monitor gas prices** - Check fee estimates before transactions
5. **Verify finality** - Wait for proper confirmation levels

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Lint code
npm run lint

# Run tests
npm test

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- [Open an issue](https://github.com/Velocity-BPA/n8n-nodes-zksync/issues) for bug reports
- [Start a discussion](https://github.com/Velocity-BPA/n8n-nodes-zksync/discussions) for feature requests

## Acknowledgments

- [n8n](https://n8n.io) - Workflow automation platform
- [zkSync Era](https://zksync.io) - Layer 2 scaling solution
- [Matter Labs](https://matter-labs.io) - zkSync developers
