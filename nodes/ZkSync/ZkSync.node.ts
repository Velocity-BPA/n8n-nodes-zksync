/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { Wallet, Contract, types } from 'zksync-ethers';
import { ethers } from 'ethers';

import { getNetworkConfig } from './constants/networks';
import { SYSTEM_CONTRACTS } from './constants/systemContracts';
import { ERC20_ABI, ERC721_ABI } from './constants/tokens';
import {
	createZkSyncClient,
	isValidAddress,
	formatAddress,
	formatEther,
	parseEther,
	formatUnits,
	parseUnits,
	keccak256,
	encodeAbiParameters,
	decodeAbiParameters,
	getGeneralPaymasterParams,
	getApprovalBasedPaymasterParams,
} from './transport/zksyncClient';
import { convertUnits } from './utils/unitConverter';

export class ZkSync implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'zkSync Era',
		name: 'zkSync',
		icon: 'file:zksync.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with zkSync Era blockchain - Account Abstraction, Paymasters, L1↔L2 Bridging, and more',
		defaults: {
			name: 'zkSync Era',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'zkSyncNetwork',
				required: true,
			},
			{
				name: 'zkSyncPaymaster',
				required: false,
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Account Abstraction', value: 'accountAbstraction' },
					{ name: 'Block', value: 'block' },
					{ name: 'Bridge', value: 'bridge' },
					{ name: 'Contract', value: 'contract' },
					{ name: 'Events', value: 'events' },
					{ name: 'Fee', value: 'fee' },
					{ name: 'L1 Interaction', value: 'l1Interaction' },
					{ name: 'NFT', value: 'nft' },
					{ name: 'Paymaster', value: 'paymaster' },
					{ name: 'Proof', value: 'proof' },
					{ name: 'System Contracts', value: 'systemContracts' },
					{ name: 'Token', value: 'token' },
					{ name: 'Transaction', value: 'transaction' },
					{ name: 'Utility', value: 'utility' },
				],
				default: 'account',
			},

			// ==================== ACCOUNT OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{ name: 'Get Balance', value: 'getBalance', action: 'Get account balance' },
					{ name: 'Get Nonce', value: 'getNonce', action: 'Get account nonce' },
					{ name: 'Get Transaction Count', value: 'getTransactionCount', action: 'Get transaction count' },
					{ name: 'Is Contract', value: 'isContract', action: 'Check if address is a contract' },
					{ name: 'Get Code', value: 'getCode', action: 'Get contract bytecode' },
				],
				default: 'getBalance',
			},

			// ==================== TRANSACTION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['transaction'] } },
				options: [
					{ name: 'Send ETH', value: 'sendEth', action: 'Send ETH to an address' },
					{ name: 'Get Transaction', value: 'getTransaction', action: 'Get transaction by hash' },
					{ name: 'Get Transaction Receipt', value: 'getReceipt', action: 'Get transaction receipt' },
					{ name: 'Get Transaction Status', value: 'getStatus', action: 'Get transaction status' },
					{ name: 'Estimate Gas', value: 'estimateGas', action: 'Estimate gas for a transaction' },
					{ name: 'Get Gas Price', value: 'getGasPrice', action: 'Get current gas price' },
				],
				default: 'sendEth',
			},

			// ==================== ACCOUNT ABSTRACTION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['accountAbstraction'] } },
				options: [
					{ name: 'Get Account Type', value: 'getAccountType', action: 'Detect account type' },
					{ name: 'Get Deployment Nonce', value: 'getDeploymentNonce', action: 'Get deployment nonce' },
				],
				default: 'getAccountType',
			},

			// ==================== PAYMASTER OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['paymaster'] } },
				options: [
					{ name: 'Get Testnet Paymaster', value: 'getTestnetPaymaster', action: 'Get testnet paymaster address' },
					{ name: 'Build General Params', value: 'buildGeneralParams', action: 'Build general paymaster params' },
					{ name: 'Build Approval Params', value: 'buildApprovalParams', action: 'Build approval-based paymaster params' },
				],
				default: 'getTestnetPaymaster',
			},

			// ==================== TOKEN OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['token'] } },
				options: [
					{ name: 'Get Token Balance', value: 'getBalance', action: 'Get ERC-20 token balance' },
					{ name: 'Get Token Info', value: 'getInfo', action: 'Get token information' },
					{ name: 'Transfer Tokens', value: 'transfer', action: 'Transfer ERC-20 tokens' },
					{ name: 'Approve Spending', value: 'approve', action: 'Approve token spending' },
					{ name: 'Get Allowance', value: 'getAllowance', action: 'Get spending allowance' },
				],
				default: 'getBalance',
			},

			// ==================== NFT OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['nft'] } },
				options: [
					{ name: 'Get NFT Balance', value: 'getBalance', action: 'Get NFT balance' },
					{ name: 'Get NFT Owner', value: 'getOwner', action: 'Get NFT owner' },
					{ name: 'Get Token URI', value: 'getTokenUri', action: 'Get NFT metadata URI' },
					{ name: 'Transfer NFT', value: 'transfer', action: 'Transfer NFT' },
				],
				default: 'getBalance',
			},

			// ==================== CONTRACT OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contract'] } },
				options: [
					{ name: 'Read Contract', value: 'read', action: 'Read from contract' },
					{ name: 'Write Contract', value: 'write', action: 'Write to contract' },
					{ name: 'Get Contract Code', value: 'getCode', action: 'Get contract bytecode' },
				],
				default: 'read',
			},

			// ==================== BRIDGE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['bridge'] } },
				options: [
					{ name: 'Get Bridge Addresses', value: 'getBridgeAddresses', action: 'Get bridge contract addresses' },
					{ name: 'Get L2 Token Address', value: 'getL2TokenAddress', action: 'Get L2 address of bridged token' },
				],
				default: 'getBridgeAddresses',
			},

			// ==================== BLOCK OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['block'] } },
				options: [
					{ name: 'Get Block', value: 'getBlock', action: 'Get block by number or hash' },
					{ name: 'Get Latest Block', value: 'getLatestBlock', action: 'Get latest block number' },
					{ name: 'Get Block Details', value: 'getBlockDetails', action: 'Get detailed block information' },
					{ name: 'Get L1 Batch Number', value: 'getL1BatchNumber', action: 'Get latest L1 batch number' },
					{ name: 'Get L1 Batch Details', value: 'getL1BatchDetails', action: 'Get L1 batch details' },
				],
				default: 'getLatestBlock',
			},

			// ==================== PROOF OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['proof'] } },
				options: [
					{ name: 'Get Transaction Proof', value: 'getTransactionProof', action: 'Get ZK proof for transaction' },
					{ name: 'Get Log Proof', value: 'getLogProof', action: 'Get ZK proof for log entry' },
				],
				default: 'getTransactionProof',
			},

			// ==================== FEE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['fee'] } },
				options: [
					{ name: 'Get Gas Price', value: 'getGasPrice', action: 'Get current gas price' },
					{ name: 'Get Fee Params', value: 'getFeeParams', action: 'Get fee parameters' },
					{ name: 'Estimate Gas', value: 'estimateGas', action: 'Estimate gas for transaction' },
				],
				default: 'getGasPrice',
			},

			// ==================== EVENTS OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['events'] } },
				options: [
					{ name: 'Get Logs', value: 'getLogs', action: 'Get event logs' },
				],
				default: 'getLogs',
			},

			// ==================== L1 INTERACTION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['l1Interaction'] } },
				options: [
					{ name: 'Get L1 Chain ID', value: 'getL1ChainId', action: 'Get L1 chain ID' },
					{ name: 'Get Main Contract', value: 'getMainContract', action: 'Get zkSync main contract address' },
					{ name: 'Get Base Token', value: 'getBaseToken', action: 'Get base token address' },
				],
				default: 'getL1ChainId',
			},

			// ==================== SYSTEM CONTRACTS OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['systemContracts'] } },
				options: [
					{ name: 'Get All System Contracts', value: 'getAllContracts', action: 'Get all system contract addresses' },
					{ name: 'Get Contract Deployer', value: 'getContractDeployer', action: 'Get contract deployer address' },
					{ name: 'Get Nonce Holder', value: 'getNonceHolder', action: 'Get nonce holder address' },
				],
				default: 'getAllContracts',
			},

			// ==================== UTILITY OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['utility'] } },
				options: [
					{ name: 'Convert Units', value: 'convertUnits', action: 'Convert between ETH units' },
					{ name: 'Validate Address', value: 'validateAddress', action: 'Validate Ethereum address' },
					{ name: 'Hash Data', value: 'hashData', action: 'Hash data using keccak256' },
					{ name: 'Encode ABI', value: 'encodeAbi', action: 'Encode ABI data' },
					{ name: 'Decode ABI', value: 'decodeAbi', action: 'Decode ABI data' },
					{ name: 'Sign Message', value: 'signMessage', action: 'Sign message with wallet' },
					{ name: 'Generate Wallet', value: 'generateWallet', action: 'Generate new wallet' },
				],
				default: 'convertUnits',
			},

			// ==================== COMMON PARAMETERS ====================
			// Address input
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						resource: ['account', 'token', 'nft', 'contract', 'events'],
						operation: ['getBalance', 'getNonce', 'getTransactionCount', 'isContract', 'getCode', 'getInfo', 'transfer', 'approve', 'getAllowance', 'getOwner', 'read', 'write', 'getCode', 'getLogs'],
					},
				},
			},

			// Contract address for tokens/NFTs
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						resource: ['token', 'nft'],
					},
				},
			},

			// Recipient address
			{
				displayName: 'To Address',
				name: 'toAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['sendEth', 'transfer'],
					},
				},
			},

			// Amount in ETH
			{
				displayName: 'Amount (ETH)',
				name: 'amount',
				type: 'string',
				default: '0',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendEth'],
					},
				},
			},

			// Amount for tokens
			{
				displayName: 'Amount',
				name: 'tokenAmount',
				type: 'string',
				default: '0',
				required: true,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['transfer', 'approve'],
					},
				},
			},

			// Transaction hash
			{
				displayName: 'Transaction Hash',
				name: 'txHash',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['getTransaction', 'getReceipt', 'getStatus', 'getTransactionProof'],
					},
				},
			},

			// Block number/hash
			{
				displayName: 'Block Number or Hash',
				name: 'blockId',
				type: 'string',
				default: 'latest',
				displayOptions: {
					show: {
						operation: ['getBlock', 'getBlockDetails'],
					},
				},
			},

			// L1 Batch number
			{
				displayName: 'L1 Batch Number',
				name: 'batchNumber',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						operation: ['getL1BatchDetails'],
					},
				},
			},

			// Token ID for NFTs
			{
				displayName: 'Token ID',
				name: 'tokenId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['nft'],
						operation: ['getOwner', 'getTokenUri', 'transfer'],
					},
				},
			},

			// Spender address for approvals
			{
				displayName: 'Spender Address',
				name: 'spenderAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['approve', 'getAllowance'],
					},
				},
			},

			// Owner address for allowance
			{
				displayName: 'Owner Address',
				name: 'ownerAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['getAllowance'],
					},
				},
			},

			// Contract ABI
			{
				displayName: 'Contract ABI',
				name: 'contractAbi',
				type: 'json',
				default: '[]',
				required: true,
				displayOptions: {
					show: {
						resource: ['contract'],
						operation: ['read', 'write'],
					},
				},
			},

			// Function name
			{
				displayName: 'Function Name',
				name: 'functionName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['contract'],
						operation: ['read', 'write'],
					},
				},
			},

			// Function arguments
			{
				displayName: 'Function Arguments (JSON)',
				name: 'functionArgs',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						resource: ['contract'],
						operation: ['read', 'write'],
					},
				},
			},

			// Paymaster address
			{
				displayName: 'Paymaster Address',
				name: 'paymasterAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['buildGeneralParams', 'buildApprovalParams'],
					},
				},
			},

			// Gas token for approval-based paymaster
			{
				displayName: 'Gas Token Address',
				name: 'gasTokenAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['buildApprovalParams'],
					},
				},
			},

			// Minimal allowance
			{
				displayName: 'Minimal Allowance',
				name: 'minimalAllowance',
				type: 'string',
				default: '1000000000000000000',
				required: true,
				displayOptions: {
					show: {
						operation: ['buildApprovalParams'],
					},
				},
			},

			// Use paymaster option
			{
				displayName: 'Use Paymaster',
				name: 'usePaymaster',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['sendEth', 'transfer', 'approve', 'write'],
					},
				},
			},

			// Unit conversion fields
			{
				displayName: 'Value',
				name: 'convertValue',
				type: 'string',
				default: '1',
				required: true,
				displayOptions: {
					show: {
						operation: ['convertUnits'],
					},
				},
			},
			{
				displayName: 'From Unit',
				name: 'fromUnit',
				type: 'options',
				options: [
					{ name: 'Wei', value: 'wei' },
					{ name: 'Gwei', value: 'gwei' },
					{ name: 'Ether', value: 'ether' },
				],
				default: 'ether',
				displayOptions: {
					show: {
						operation: ['convertUnits'],
					},
				},
			},
			{
				displayName: 'To Unit',
				name: 'toUnit',
				type: 'options',
				options: [
					{ name: 'Wei', value: 'wei' },
					{ name: 'Gwei', value: 'gwei' },
					{ name: 'Ether', value: 'ether' },
				],
				default: 'wei',
				displayOptions: {
					show: {
						operation: ['convertUnits'],
					},
				},
			},

			// Hash data input
			{
				displayName: 'Data to Hash',
				name: 'hashInput',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['hashData'],
					},
				},
			},

			// Address to validate
			{
				displayName: 'Address to Validate',
				name: 'validateAddressInput',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['validateAddress'],
					},
				},
			},

			// Message to sign
			{
				displayName: 'Message',
				name: 'signMessage',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['signMessage'],
					},
				},
			},

			// ABI encoding types
			{
				displayName: 'Types (JSON Array)',
				name: 'abiTypes',
				type: 'json',
				default: '["uint256", "address"]',
				required: true,
				displayOptions: {
					show: {
						operation: ['encodeAbi', 'decodeAbi'],
					},
				},
			},

			// ABI encoding values
			{
				displayName: 'Values (JSON Array)',
				name: 'abiValues',
				type: 'json',
				default: '[]',
				required: true,
				displayOptions: {
					show: {
						operation: ['encodeAbi'],
					},
				},
			},

			// ABI data to decode
			{
				displayName: 'Encoded Data',
				name: 'encodedData',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['decodeAbi'],
					},
				},
			},

			// L1 Token address for bridge
			{
				displayName: 'L1 Token Address',
				name: 'l1TokenAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						operation: ['getL2TokenAddress'],
					},
				},
			},

			// Event topic filter
			{
				displayName: 'Event Topic',
				name: 'eventTopic',
				type: 'string',
				default: '',
				placeholder: '0x... (keccak256 hash of event signature)',
				displayOptions: {
					show: {
						operation: ['getLogs'],
					},
				},
			},

			// From block for logs
			{
				displayName: 'From Block',
				name: 'fromBlock',
				type: 'string',
				default: 'latest',
				displayOptions: {
					show: {
						operation: ['getLogs'],
					},
				},
			},

			// To block for logs
			{
				displayName: 'To Block',
				name: 'toBlock',
				type: 'string',
				default: 'latest',
				displayOptions: {
					show: {
						operation: ['getLogs'],
					},
				},
			},

			// Log index for proof
			{
				displayName: 'Log Index',
				name: 'logIndex',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['getLogProof'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// Get credentials
				const credentials = await this.getCredentials('zkSyncNetwork');
				const network = credentials.network as string;
				const customRpcUrl = credentials.customRpcUrl as string;
				const privateKey = credentials.privateKey as string;

				// Create client
				const client = await createZkSyncClient(network, customRpcUrl, privateKey);
				const { provider, wallet } = client;

				let result: IDataObject = {};

				// ==================== ACCOUNT OPERATIONS ====================
				if (resource === 'account') {
					const address = this.getNodeParameter('address', i) as string;
					
					if (!isValidAddress(address)) {
						throw new Error('Invalid Ethereum address');
					}

					switch (operation) {
						case 'getBalance': {
							const balance = await provider.getBalance(address);
							result = {
								address: formatAddress(address),
								balanceWei: balance.toString(),
								balanceEth: formatEther(balance),
							};
							break;
						}
						case 'getNonce': {
							const nonce = await provider.getTransactionCount(address);
							result = { address: formatAddress(address), nonce };
							break;
						}
						case 'getTransactionCount': {
							const count = await provider.getTransactionCount(address);
							result = { address: formatAddress(address), transactionCount: count };
							break;
						}
						case 'isContract': {
							const code = await provider.getCode(address);
							const isContractAddress = code !== '0x';
							result = { address: formatAddress(address), isContract: isContractAddress };
							break;
						}
						case 'getCode': {
							const code = await provider.getCode(address);
							result = { address: formatAddress(address), bytecode: code };
							break;
						}
					}
				}

				// ==================== TRANSACTION OPERATIONS ====================
				else if (resource === 'transaction') {
					switch (operation) {
						case 'sendEth': {
							if (!wallet) {
								throw new Error('Private key is required to send transactions');
							}
							const toAddress = this.getNodeParameter('toAddress', i) as string;
							const amount = this.getNodeParameter('amount', i) as string;
							const usePaymaster = this.getNodeParameter('usePaymaster', i, false) as boolean;

							if (!isValidAddress(toAddress)) {
								throw new Error('Invalid recipient address');
							}

							const tx: types.TransactionRequest = {
								to: toAddress,
								value: parseEther(amount),
							};

							if (usePaymaster) {
								const config = getNetworkConfig(network, customRpcUrl);
								if (config.testnetPaymaster) {
									tx.customData = {
										paymasterParams: getGeneralPaymasterParams(config.testnetPaymaster),
									};
								}
							}

							const txResponse = await wallet.sendTransaction(tx);
							const receipt = await txResponse.wait();

							result = {
								hash: txResponse.hash,
								from: txResponse.from,
								to: txResponse.to,
								value: formatEther(txResponse.value),
								status: receipt?.status === 1 ? 'success' : 'failed',
								blockNumber: receipt?.blockNumber,
								gasUsed: receipt?.gasUsed?.toString(),
							};
							break;
						}
						case 'getTransaction': {
							const txHash = this.getNodeParameter('txHash', i) as string;
							const tx = await provider.getTransaction(txHash);
							if (tx) {
								result = {
									hash: tx.hash,
									from: tx.from,
									to: tx.to,
									value: tx.value?.toString(),
									gasLimit: tx.gasLimit?.toString(),
									gasPrice: tx.gasPrice?.toString(),
									nonce: tx.nonce,
									blockNumber: tx.blockNumber,
								};
							} else {
								result = { error: 'Transaction not found' };
							}
							break;
						}
						case 'getReceipt': {
							const txHash = this.getNodeParameter('txHash', i) as string;
							const receipt = await provider.getTransactionReceipt(txHash);
							if (receipt) {
								result = {
									hash: receipt.hash,
									status: receipt.status === 1 ? 'success' : 'failed',
									blockNumber: receipt.blockNumber,
									gasUsed: receipt.gasUsed?.toString(),
									from: receipt.from,
									to: receipt.to,
									logsCount: receipt.logs?.length || 0,
								};
							} else {
								result = { error: 'Receipt not found' };
							}
							break;
						}
						case 'getStatus': {
							const txHash = this.getNodeParameter('txHash', i) as string;
							const receipt = await provider.getTransactionReceipt(txHash);
							if (receipt) {
								result = {
									hash: txHash,
									status: receipt.status === 1 ? 'success' : 'failed',
									confirmations: receipt.confirmations,
									blockNumber: receipt.blockNumber,
								};
							} else {
								result = { hash: txHash, status: 'pending' };
							}
							break;
						}
						case 'estimateGas': {
							const toAddress = this.getNodeParameter('toAddress', i) as string;
							const amount = this.getNodeParameter('amount', i, '0') as string;
							const gas = await provider.estimateGas({
								to: toAddress,
								value: parseEther(amount),
							});
							result = { estimatedGas: gas.toString() };
							break;
						}
						case 'getGasPrice': {
							const feeData = await provider.getFeeData();
							result = {
								gasPrice: feeData.gasPrice?.toString(),
								gasPriceGwei: feeData.gasPrice ? formatUnits(feeData.gasPrice, 9) : null,
								maxFeePerGas: feeData.maxFeePerGas?.toString(),
								maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
							};
							break;
						}
					}
				}

				// ==================== ACCOUNT ABSTRACTION OPERATIONS ====================
				else if (resource === 'accountAbstraction') {
					switch (operation) {
						case 'getAccountType': {
							const address = this.getNodeParameter('address', i) as string;
							const code = await provider.getCode(address);
							const isSmartAccount = code !== '0x' && code.length > 2;
							result = {
								address: formatAddress(address),
								accountType: isSmartAccount ? 'smart_account' : 'eoa',
								hasCode: isSmartAccount,
							};
							break;
						}
						case 'getDeploymentNonce': {
							const address = this.getNodeParameter('address', i) as string;
							// Get deployment nonce from nonce holder
							const nonceHolderAbi = ['function getDeploymentNonce(address) view returns (uint256)'];
							const nonceHolder = new Contract(
								SYSTEM_CONTRACTS.NONCE_HOLDER,
								nonceHolderAbi,
								provider,
							);
							const nonce = await nonceHolder.getDeploymentNonce(address);
							result = { address: formatAddress(address), deploymentNonce: nonce.toString() };
							break;
						}
					}
				}

				// ==================== PAYMASTER OPERATIONS ====================
				else if (resource === 'paymaster') {
					switch (operation) {
						case 'getTestnetPaymaster': {
							const config = getNetworkConfig(network, customRpcUrl);
							result = {
								network,
								paymasterAddress: config.testnetPaymaster || null,
								available: !!config.testnetPaymaster,
							};
							break;
						}
						case 'buildGeneralParams': {
							const paymasterAddress = this.getNodeParameter('paymasterAddress', i) as string;
							const params = getGeneralPaymasterParams(paymasterAddress);
							result = {
								type: 'General',
								paymaster: params.paymaster,
								paymasterInput: params.paymasterInput,
							};
							break;
						}
						case 'buildApprovalParams': {
							const paymasterAddress = this.getNodeParameter('paymasterAddress', i) as string;
							const gasTokenAddress = this.getNodeParameter('gasTokenAddress', i) as string;
							const minimalAllowance = this.getNodeParameter('minimalAllowance', i) as string;
							const params = getApprovalBasedPaymasterParams(
								paymasterAddress,
								gasTokenAddress,
								BigInt(minimalAllowance),
							);
							result = {
								type: 'ApprovalBased',
								paymaster: params.paymaster,
								paymasterInput: params.paymasterInput,
								token: gasTokenAddress,
								minimalAllowance,
							};
							break;
						}
					}
				}

				// ==================== TOKEN OPERATIONS ====================
				else if (resource === 'token') {
					const contractAddress = this.getNodeParameter('contractAddress', i) as string;
					const contract = new Contract(contractAddress, ERC20_ABI, wallet || provider);

					switch (operation) {
						case 'getBalance': {
							const address = this.getNodeParameter('address', i) as string;
							const balance = await contract.balanceOf(address);
							const decimals = await contract.decimals();
							result = {
								address,
								contractAddress,
								balanceRaw: balance.toString(),
								balance: formatUnits(balance, decimals),
								decimals,
							};
							break;
						}
						case 'getInfo': {
							const [name, symbol, decimals, totalSupply] = await Promise.all([
								contract.name(),
								contract.symbol(),
								contract.decimals(),
								contract.totalSupply(),
							]);
							result = {
								contractAddress,
								name,
								symbol,
								decimals,
								totalSupply: totalSupply.toString(),
								totalSupplyFormatted: formatUnits(totalSupply, decimals),
							};
							break;
						}
						case 'transfer': {
							if (!wallet) {
								throw new Error('Private key is required to transfer tokens');
							}
							const toAddress = this.getNodeParameter('toAddress', i) as string;
							const tokenAmount = this.getNodeParameter('tokenAmount', i) as string;
							const decimals = await contract.decimals();
							const amount = parseUnits(tokenAmount, decimals);
							const tx = await contract.transfer(toAddress, amount);
							const receipt = await tx.wait();
							result = {
								hash: tx.hash,
								from: wallet.address,
								to: toAddress,
								amount: tokenAmount,
								status: receipt?.status === 1 ? 'success' : 'failed',
							};
							break;
						}
						case 'approve': {
							if (!wallet) {
								throw new Error('Private key is required to approve tokens');
							}
							const spenderAddress = this.getNodeParameter('spenderAddress', i) as string;
							const tokenAmount = this.getNodeParameter('tokenAmount', i) as string;
							const decimals = await contract.decimals();
							const amount = parseUnits(tokenAmount, decimals);
							const tx = await contract.approve(spenderAddress, amount);
							const receipt = await tx.wait();
							result = {
								hash: tx.hash,
								owner: wallet.address,
								spender: spenderAddress,
								amount: tokenAmount,
								status: receipt?.status === 1 ? 'success' : 'failed',
							};
							break;
						}
						case 'getAllowance': {
							const ownerAddress = this.getNodeParameter('ownerAddress', i) as string;
							const spenderAddress = this.getNodeParameter('spenderAddress', i) as string;
							const allowance = await contract.allowance(ownerAddress, spenderAddress);
							const decimals = await contract.decimals();
							result = {
								owner: ownerAddress,
								spender: spenderAddress,
								allowanceRaw: allowance.toString(),
								allowance: formatUnits(allowance, decimals),
							};
							break;
						}
					}
				}

				// ==================== NFT OPERATIONS ====================
				else if (resource === 'nft') {
					const contractAddress = this.getNodeParameter('contractAddress', i) as string;
					const contract = new Contract(contractAddress, ERC721_ABI, wallet || provider);

					switch (operation) {
						case 'getBalance': {
							const address = this.getNodeParameter('address', i) as string;
							const balance = await contract.balanceOf(address);
							result = { address, contractAddress, balance: balance.toString() };
							break;
						}
						case 'getOwner': {
							const tokenId = this.getNodeParameter('tokenId', i) as string;
							const owner = await contract.ownerOf(tokenId);
							result = { contractAddress, tokenId, owner };
							break;
						}
						case 'getTokenUri': {
							const tokenId = this.getNodeParameter('tokenId', i) as string;
							const tokenUri = await contract.tokenURI(tokenId);
							result = { contractAddress, tokenId, tokenUri };
							break;
						}
						case 'transfer': {
							if (!wallet) {
								throw new Error('Private key is required to transfer NFTs');
							}
							const toAddress = this.getNodeParameter('toAddress', i) as string;
							const tokenId = this.getNodeParameter('tokenId', i) as string;
							const tx = await contract.transferFrom(wallet.address, toAddress, tokenId);
							const receipt = await tx.wait();
							result = {
								hash: tx.hash,
								from: wallet.address,
								to: toAddress,
								tokenId,
								status: receipt?.status === 1 ? 'success' : 'failed',
							};
							break;
						}
					}
				}

				// ==================== CONTRACT OPERATIONS ====================
				else if (resource === 'contract') {
					const address = this.getNodeParameter('address', i) as string;

					switch (operation) {
						case 'read': {
							const abi = this.getNodeParameter('contractAbi', i) as string;
							const functionName = this.getNodeParameter('functionName', i) as string;
							const functionArgs = this.getNodeParameter('functionArgs', i, '[]') as string;
							const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;
							const parsedArgs = typeof functionArgs === 'string' ? JSON.parse(functionArgs) : functionArgs;
							const contract = new Contract(address, parsedAbi, provider);
							const response = await contract[functionName](...parsedArgs);
							result = {
								address,
								function: functionName,
								result: typeof response === 'bigint' ? response.toString() : response,
							};
							break;
						}
						case 'write': {
							if (!wallet) {
								throw new Error('Private key is required to write to contracts');
							}
							const abi = this.getNodeParameter('contractAbi', i) as string;
							const functionName = this.getNodeParameter('functionName', i) as string;
							const functionArgs = this.getNodeParameter('functionArgs', i, '[]') as string;
							const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;
							const parsedArgs = typeof functionArgs === 'string' ? JSON.parse(functionArgs) : functionArgs;
							const contract = new Contract(address, parsedAbi, wallet);
							const tx = await contract[functionName](...parsedArgs);
							const receipt = await tx.wait();
							result = {
								address,
								function: functionName,
								hash: tx.hash,
								status: receipt?.status === 1 ? 'success' : 'failed',
							};
							break;
						}
						case 'getCode': {
							const code = await provider.getCode(address);
							result = { address, bytecode: code, hasCode: code !== '0x' };
							break;
						}
					}
				}

				// ==================== BRIDGE OPERATIONS ====================
				else if (resource === 'bridge') {
					switch (operation) {
						case 'getBridgeAddresses': {
							const bridgeAddresses = await provider.getDefaultBridgeAddresses();
							const config = getNetworkConfig(network, customRpcUrl);
							result = {
								network,
								l1Bridge: config.bridgeAddress,
								l2SharedBridge: bridgeAddresses.sharedL2,
							};
							break;
						}
						case 'getL2TokenAddress': {
							const l1TokenAddress = this.getNodeParameter('l1TokenAddress', i) as string;
							const l2Address = await provider.l2TokenAddress(l1TokenAddress);
							result = { l1TokenAddress, l2TokenAddress: l2Address };
							break;
						}
					}
				}

				// ==================== BLOCK OPERATIONS ====================
				else if (resource === 'block') {
					switch (operation) {
						case 'getBlock': {
							const blockId = this.getNodeParameter('blockId', i) as string;
							const block = await provider.getBlock(blockId);
							if (block) {
								result = {
									number: block.number,
									hash: block.hash,
									timestamp: block.timestamp,
									timestampDate: new Date(block.timestamp * 1000).toISOString(),
									gasLimit: block.gasLimit?.toString(),
									gasUsed: block.gasUsed?.toString(),
									transactionCount: block.transactions?.length || 0,
								};
							} else {
								result = { error: 'Block not found' };
							}
							break;
						}
						case 'getLatestBlock': {
							const blockNumber = await provider.getBlockNumber();
							result = { latestBlockNumber: blockNumber };
							break;
						}
						case 'getBlockDetails': {
							const blockId = this.getNodeParameter('blockId', i) as string;
							const blockNumber = blockId === 'latest' ? await provider.getBlockNumber() : parseInt(blockId, 10);
							const details = await provider.getBlockDetails(blockNumber);
							result = {
								number: details.number,
								l1BatchNumber: details.l1BatchNumber,
								timestamp: details.timestamp,
								l1TxCount: details.l1TxCount,
								l2TxCount: details.l2TxCount,
								rootHash: details.rootHash,
								status: details.status,
							};
							break;
						}
						case 'getL1BatchNumber': {
							const batchNumber = await provider.getL1BatchNumber();
							result = { l1BatchNumber: batchNumber };
							break;
						}
						case 'getL1BatchDetails': {
							const batchNumber = this.getNodeParameter('batchNumber', i) as number;
							const details = await provider.getL1BatchDetails(batchNumber);
							result = {
								number: details.number,
								timestamp: details.timestamp,
								l1TxCount: details.l1TxCount,
								l2TxCount: details.l2TxCount,
								rootHash: details.rootHash,
								status: details.status,
								commitTxHash: details.commitTxHash,
								proveTxHash: details.proveTxHash,
								executeTxHash: details.executeTxHash,
							};
							break;
						}
					}
				}

				// ==================== PROOF OPERATIONS ====================
				else if (resource === 'proof') {
					switch (operation) {
						case 'getTransactionProof': {
							const txHash = this.getNodeParameter('txHash', i) as string;
							const txDetails = await provider.getTransactionDetails(txHash);
							// TransactionDetails may include l1BatchNumber and l1BatchTxIndex
							const detailsWithBatch = txDetails as types.TransactionDetails & { l1BatchNumber?: number | null; l1BatchTxIndex?: number | null };
							result = {
								txHash,
								l1BatchNumber: detailsWithBatch.l1BatchNumber ?? null,
								l1BatchTxIndex: detailsWithBatch.l1BatchTxIndex ?? null,
								status: txDetails.status,
								isL1Originated: txDetails.isL1Originated,
							};
							break;
						}
						case 'getLogProof': {
							const txHash = this.getNodeParameter('txHash', i) as string;
							const logIndex = this.getNodeParameter('logIndex', i) as number;
							const proof = await provider.getLogProof(txHash, logIndex);
							result = {
								txHash,
								logIndex,
								proof: proof ? {
									id: proof.id,
									proof: proof.proof,
									root: proof.root,
								} : null,
							};
							break;
						}
					}
				}

				// ==================== FEE OPERATIONS ====================
				else if (resource === 'fee') {
					switch (operation) {
						case 'getGasPrice': {
							const gasPrice = await provider.getGasPrice();
							result = {
								gasPriceWei: gasPrice.toString(),
								gasPriceGwei: formatUnits(gasPrice, 9),
							};
							break;
						}
						case 'getFeeParams': {
							const feeParams = await provider.getFeeParams();
							result = {
								V2: feeParams.V2 ? {
									config: feeParams.V2.config,
									l1GasPrice: feeParams.V2.l1_gas_price?.toString(),
									l1PubdataPrice: feeParams.V2.l1_pubdata_price?.toString(),
								} : null,
							};
							break;
						}
						case 'estimateGas': {
							const toAddress = this.getNodeParameter('toAddress', i) as string;
							const amount = this.getNodeParameter('amount', i, '0') as string;
							const gas = await provider.estimateGas({
								to: toAddress,
								value: parseEther(amount),
							});
							result = { estimatedGas: gas.toString() };
							break;
						}
					}
				}

				// ==================== EVENTS OPERATIONS ====================
				else if (resource === 'events') {
					switch (operation) {
						case 'getLogs': {
							const address = this.getNodeParameter('address', i) as string;
							const fromBlock = this.getNodeParameter('fromBlock', i) as string;
							const toBlock = this.getNodeParameter('toBlock', i) as string;
							const eventTopic = this.getNodeParameter('eventTopic', i, '') as string;

							const filter: ethers.Filter = {
								address,
								fromBlock: fromBlock === 'latest' ? 'latest' : parseInt(fromBlock, 10),
								toBlock: toBlock === 'latest' ? 'latest' : parseInt(toBlock, 10),
							};

							if (eventTopic) {
								filter.topics = [eventTopic];
							}

							const logs = await provider.getLogs(filter);
							result = {
								address,
								logsCount: logs.length,
								logs: logs.map((log) => ({
									blockNumber: log.blockNumber,
									transactionHash: log.transactionHash,
									logIndex: log.index,
									topics: log.topics,
									data: log.data,
								})),
							};
							break;
						}
					}
				}

				// ==================== L1 INTERACTION OPERATIONS ====================
				else if (resource === 'l1Interaction') {
					switch (operation) {
						case 'getL1ChainId': {
							const l1ChainId = await provider.getL1ChainId();
							result = { l1ChainId: Number(l1ChainId) };
							break;
						}
						case 'getMainContract': {
							const mainContract = await provider.getMainContractAddress();
							result = { mainContractAddress: mainContract };
							break;
						}
						case 'getBaseToken': {
							const baseToken = await provider.getBaseTokenContractAddress();
							result = { baseTokenAddress: baseToken };
							break;
						}
					}
				}

				// ==================== SYSTEM CONTRACTS OPERATIONS ====================
				else if (resource === 'systemContracts') {
					switch (operation) {
						case 'getAllContracts': {
							result = { systemContracts: SYSTEM_CONTRACTS };
							break;
						}
						case 'getContractDeployer': {
							result = {
								name: 'CONTRACT_DEPLOYER',
								address: SYSTEM_CONTRACTS.CONTRACT_DEPLOYER,
								description: 'Handles contract deployment logic',
							};
							break;
						}
						case 'getNonceHolder': {
							result = {
								name: 'NONCE_HOLDER',
								address: SYSTEM_CONTRACTS.NONCE_HOLDER,
								description: 'Manages account nonces for transactions and deployments',
							};
							break;
						}
					}
				}

				// ==================== UTILITY OPERATIONS ====================
				else if (resource === 'utility') {
					switch (operation) {
						case 'convertUnits': {
							const value = this.getNodeParameter('convertValue', i) as string;
							const fromUnit = this.getNodeParameter('fromUnit', i) as 'wei' | 'gwei' | 'ether';
							const toUnit = this.getNodeParameter('toUnit', i) as 'wei' | 'gwei' | 'ether';
							const converted = convertUnits(value, fromUnit, toUnit);
							result = { input: value, fromUnit, toUnit, result: converted };
							break;
						}
						case 'validateAddress': {
							const address = this.getNodeParameter('validateAddressInput', i) as string;
							const isValid = isValidAddress(address);
							result = {
								address,
								isValid,
								checksumAddress: isValid ? formatAddress(address) : null,
							};
							break;
						}
						case 'hashData': {
							const data = this.getNodeParameter('hashInput', i) as string;
							const hash = keccak256(data);
							result = { input: data, keccak256: hash };
							break;
						}
						case 'encodeAbi': {
							const types = this.getNodeParameter('abiTypes', i) as string;
							const values = this.getNodeParameter('abiValues', i) as string;
							const parsedTypes = typeof types === 'string' ? JSON.parse(types) : types;
							const parsedValues = typeof values === 'string' ? JSON.parse(values) : values;
							const encoded = encodeAbiParameters(parsedTypes, parsedValues);
							result = { types: parsedTypes, values: parsedValues, encoded };
							break;
						}
						case 'decodeAbi': {
							const types = this.getNodeParameter('abiTypes', i) as string;
							const data = this.getNodeParameter('encodedData', i) as string;
							const parsedTypes = typeof types === 'string' ? JSON.parse(types) : types;
							const decoded = decodeAbiParameters(parsedTypes, data);
							result = {
								types: parsedTypes,
								data,
								decoded: decoded.map((v) => (typeof v === 'bigint' ? v.toString() : v)),
							};
							break;
						}
						case 'signMessage': {
							if (!wallet) {
								throw new Error('Private key is required to sign messages');
							}
							const message = this.getNodeParameter('signMessage', i) as string;
							const signature = await wallet.signMessage(message);
							result = {
								message,
								signature,
								signer: wallet.address,
							};
							break;
						}
						case 'generateWallet': {
							const newWallet = Wallet.createRandom();
							result = {
								address: newWallet.address,
								privateKey: newWallet.privateKey,
								mnemonic: newWallet.mnemonic?.phrase || null,
								warning: 'Store these credentials securely! Never share your private key.',
							};
							break;
						}
					}
				}

				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
