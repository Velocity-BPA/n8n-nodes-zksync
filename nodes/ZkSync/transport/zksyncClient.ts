/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { Provider, Wallet, types, utils } from 'zksync-ethers';
import { ethers } from 'ethers';
import { getNetworkConfig } from '../constants/networks';

/**
 * Licensing notice - logged once per node load
 */
let licensingNoticeLogged = false;

function logLicensingNotice(): void {
	if (!licensingNoticeLogged) {
		console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);
		licensingNoticeLogged = true;
	}
}

export interface ZkSyncClient {
	provider: Provider;
	wallet?: Wallet;
	network: string;
	chainId: number;
}

/**
 * Create a zkSync client from credentials
 */
export async function createZkSyncClient(
	network: string,
	customRpcUrl?: string,
	privateKey?: string,
): Promise<ZkSyncClient> {
	logLicensingNotice();

	const config = getNetworkConfig(network, customRpcUrl);
	const provider = new Provider(config.rpcUrl);

	let wallet: Wallet | undefined;
	if (privateKey) {
		wallet = new Wallet(privateKey, provider);
	}

	const networkInfo = await provider.getNetwork();

	return {
		provider,
		wallet,
		network: config.name,
		chainId: Number(networkInfo.chainId),
	};
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
	return ethers.isAddress(address);
}

/**
 * Format address to checksum format
 */
export function formatAddress(address: string): string {
	return ethers.getAddress(address);
}

/**
 * Get transaction receipt with retries
 */
export async function getTransactionReceipt(
	provider: Provider,
	txHash: string,
	maxRetries = 3,
): Promise<types.TransactionReceipt | null> {
	for (let i = 0; i < maxRetries; i++) {
		const receipt = await provider.getTransactionReceipt(txHash);
		if (receipt) {
			return receipt as types.TransactionReceipt;
		}
		if (i < maxRetries - 1) {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
	return null;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
	provider: Provider,
	txHash: string,
	confirmations = 1,
	timeout = 60000,
): Promise<types.TransactionReceipt | null> {
	const receipt = await provider.waitForTransaction(txHash, confirmations, timeout);
	return receipt as types.TransactionReceipt | null;
}

/**
 * Wait for transaction finalization
 */
export async function waitForFinalization(
	provider: Provider,
	txHash: string,
	timeout = 120000,
): Promise<types.TransactionReceipt | null> {
	const receipt = await provider.waitForTransaction(txHash, undefined, timeout);
	return receipt as types.TransactionReceipt | null;
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
	provider: Provider,
	tx: types.TransactionRequest,
): Promise<bigint> {
	return await provider.estimateGas(tx);
}

/**
 * Get current gas price
 */
export async function getGasPrice(provider: Provider): Promise<bigint> {
	const feeData = await provider.getFeeData();
	return feeData.gasPrice || BigInt(0);
}

/**
 * Get L1 gas price (for L1 -> L2 transactions)
 */
export async function getL1GasPrice(provider: Provider): Promise<bigint> {
	return await provider.getL1BatchNumber().then(() => provider.getGasPrice());
}

/**
 * Format ETH amount from wei
 */
export function formatEther(wei: bigint | string): string {
	return ethers.formatEther(wei);
}

/**
 * Parse ETH amount to wei
 */
export function parseEther(ether: string): bigint {
	return ethers.parseEther(ether);
}

/**
 * Format units (with custom decimals)
 */
export function formatUnits(value: bigint | string, decimals: number): string {
	return ethers.formatUnits(value, decimals);
}

/**
 * Parse units (with custom decimals)
 */
export function parseUnits(value: string, decimals: number): bigint {
	return ethers.parseUnits(value, decimals);
}

/**
 * Get block details
 */
export async function getBlock(
	provider: Provider,
	blockHashOrNumber: string | number,
): Promise<types.Block | null> {
	return await provider.getBlock(blockHashOrNumber) as types.Block | null;
}

/**
 * Get latest block number
 */
export async function getBlockNumber(provider: Provider): Promise<number> {
	return await provider.getBlockNumber();
}

/**
 * Get account balance
 */
export async function getBalance(
	provider: Provider,
	address: string,
	blockTag: types.BlockTag = 'latest',
): Promise<bigint> {
	return await provider.getBalance(address, blockTag);
}

/**
 * Get account nonce
 */
export async function getNonce(
	provider: Provider,
	address: string,
	blockTag: types.BlockTag = 'latest',
): Promise<number> {
	return await provider.getTransactionCount(address, blockTag);
}

/**
 * Check if address is a contract
 */
export async function isContract(provider: Provider, address: string): Promise<boolean> {
	const code = await provider.getCode(address);
	return code !== '0x';
}

/**
 * Get contract bytecode
 */
export async function getCode(provider: Provider, address: string): Promise<string> {
	return await provider.getCode(address);
}

/**
 * zkSync-specific: Get L1 batch number
 */
export async function getL1BatchNumber(provider: Provider): Promise<number> {
	return await provider.getL1BatchNumber();
}

/**
 * zkSync-specific: Get L1 batch details
 */
export async function getL1BatchDetails(
	provider: Provider,
	batchNumber: number,
): Promise<types.BatchDetails> {
	return await provider.getL1BatchDetails(batchNumber);
}

/**
 * zkSync-specific: Get block details (extended)
 */
export async function getBlockDetails(
	provider: Provider,
	blockNumber: number,
): Promise<types.BlockDetails> {
	return await provider.getBlockDetails(blockNumber);
}

/**
 * zkSync-specific: Get transaction details
 */
export async function getTransactionDetails(
	provider: Provider,
	txHash: string,
): Promise<types.TransactionDetails> {
	return await provider.getTransactionDetails(txHash);
}

/**
 * zkSync-specific: Get fee parameters
 */
export async function getFeeParams(provider: Provider): Promise<types.FeeParams> {
	return await provider.getFeeParams();
}

/**
 * zkSync-specific: Estimate fee for L1 -> L2 transaction
 */
export async function estimateL1ToL2Execute(
	provider: Provider,
	tx: {
		contractAddress: string;
		calldata: string;
		caller?: string;
		l2Value?: bigint;
		factoryDeps?: ethers.BytesLike[];
		gasPerPubdataByte?: bigint;
		overrides?: ethers.Overrides;
	},
): Promise<bigint> {
	return await provider.estimateL1ToL2Execute(tx);
}

/**
 * Sign message with wallet
 */
export async function signMessage(wallet: Wallet, message: string): Promise<string> {
	return await wallet.signMessage(message);
}

/**
 * Verify message signature
 */
export function verifyMessage(message: string, signature: string): string {
	return ethers.verifyMessage(message, signature);
}

/**
 * Hash data using keccak256
 */
export function keccak256(data: string): string {
	return ethers.keccak256(ethers.toUtf8Bytes(data));
}

/**
 * Encode ABI data
 */
export function encodeAbiParameters(types: string[], values: unknown[]): string {
	const abiCoder = ethers.AbiCoder.defaultAbiCoder();
	return abiCoder.encode(types, values);
}

/**
 * Decode ABI data
 */
export function decodeAbiParameters(types: string[], data: string): ethers.Result {
	const abiCoder = ethers.AbiCoder.defaultAbiCoder();
	return abiCoder.decode(types, data);
}

/**
 * Get paymaster params for general paymaster
 */
export function getGeneralPaymasterParams(paymasterAddress: string): types.PaymasterParams {
	const params = utils.getPaymasterParams(paymasterAddress, {
		type: 'General',
		innerInput: '0x',
	});
	return {
		paymaster: paymasterAddress,
		paymasterInput: typeof params.paymasterInput === 'string' 
			? params.paymasterInput 
			: ethers.hexlify(params.paymasterInput),
	};
}

/**
 * Get paymaster params for approval-based paymaster
 */
export function getApprovalBasedPaymasterParams(
	paymasterAddress: string,
	tokenAddress: string,
	minimalAllowance: bigint,
	innerInput = '0x',
): types.PaymasterParams {
	const params = utils.getPaymasterParams(paymasterAddress, {
		type: 'ApprovalBased',
		token: tokenAddress,
		minimalAllowance,
		innerInput,
	});
	return {
		paymaster: paymasterAddress,
		paymasterInput: typeof params.paymasterInput === 'string' 
			? params.paymasterInput 
			: ethers.hexlify(params.paymasterInput),
	};
}
