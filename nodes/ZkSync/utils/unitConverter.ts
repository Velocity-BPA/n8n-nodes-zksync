/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

export type EthUnit = 'wei' | 'kwei' | 'mwei' | 'gwei' | 'szabo' | 'finney' | 'ether';

const UNIT_DECIMALS: Record<EthUnit, number> = {
	wei: 0,
	kwei: 3,
	mwei: 6,
	gwei: 9,
	szabo: 12,
	finney: 15,
	ether: 18,
};

/**
 * Convert between Ethereum units
 */
export function convertUnits(value: string, fromUnit: EthUnit, toUnit: EthUnit): string {
	const fromDecimals = UNIT_DECIMALS[fromUnit];
	const toDecimals = UNIT_DECIMALS[toUnit];

	// Convert to wei first
	const weiValue = ethers.parseUnits(value, fromDecimals);

	// Then convert to target unit
	return ethers.formatUnits(weiValue, toDecimals);
}

/**
 * Convert wei to ETH
 */
export function weiToEth(wei: bigint | string): string {
	return ethers.formatEther(wei);
}

/**
 * Convert ETH to wei
 */
export function ethToWei(eth: string): bigint {
	return ethers.parseEther(eth);
}

/**
 * Convert wei to Gwei
 */
export function weiToGwei(wei: bigint | string): string {
	return ethers.formatUnits(wei, 9);
}

/**
 * Convert Gwei to wei
 */
export function gweiToWei(gwei: string): bigint {
	return ethers.parseUnits(gwei, 9);
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: bigint | string, decimals: number): string {
	return ethers.formatUnits(amount, decimals);
}

/**
 * Parse token amount to smallest unit
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
	return ethers.parseUnits(amount, decimals);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: string | number | bigint): string {
	return BigInt(value).toLocaleString('en-US');
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 4): string {
	return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gasPriceWei: bigint): string {
	const gwei = ethers.formatUnits(gasPriceWei, 9);
	return `${parseFloat(gwei).toFixed(2)} Gwei`;
}

/**
 * Calculate transaction cost
 */
export function calculateTxCost(gasUsed: bigint, gasPrice: bigint): {
	wei: string;
	gwei: string;
	eth: string;
} {
	const cost = gasUsed * gasPrice;
	return {
		wei: cost.toString(),
		gwei: ethers.formatUnits(cost, 9),
		eth: ethers.formatEther(cost),
	};
}
