/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface TokenInfo {
	symbol: string;
	name: string;
	decimals: number;
	address: string;
	l1Address?: string;
}

/**
 * Common tokens on zkSync Era Mainnet
 */
export const MAINNET_TOKENS: Record<string, TokenInfo> = {
	ETH: {
		symbol: 'ETH',
		name: 'Ether',
		decimals: 18,
		address: '0x0000000000000000000000000000000000000000',
	},
	USDC: {
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
		address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
		l1Address: '0xA0b86a90Ce9f1B28B1fFcC21c13DaEDf21bEe67c',
	},
	USDT: {
		symbol: 'USDT',
		name: 'Tether USD',
		decimals: 6,
		address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
		l1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
	},
	WBTC: {
		symbol: 'WBTC',
		name: 'Wrapped Bitcoin',
		decimals: 8,
		address: '0xBBeB516fb02a01611cBBE0453Fe3c580D7281011',
		l1Address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
	},
	WETH: {
		symbol: 'WETH',
		name: 'Wrapped Ether',
		decimals: 18,
		address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
		l1Address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
	},
};

/**
 * Common tokens on zkSync Era Sepolia Testnet
 */
export const SEPOLIA_TOKENS: Record<string, TokenInfo> = {
	ETH: {
		symbol: 'ETH',
		name: 'Ether',
		decimals: 18,
		address: '0x0000000000000000000000000000000000000000',
	},
};

/**
 * ERC-20 ABI for token operations
 */
export const ERC20_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address account) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function allowance(address owner, address spender) view returns (uint256)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function transferFrom(address from, address to, uint256 amount) returns (bool)',
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

/**
 * ERC-721 ABI for NFT operations
 */
export const ERC721_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function tokenURI(uint256 tokenId) view returns (string)',
	'function balanceOf(address owner) view returns (uint256)',
	'function ownerOf(uint256 tokenId) view returns (address)',
	'function approve(address to, uint256 tokenId)',
	'function getApproved(uint256 tokenId) view returns (address)',
	'function setApprovalForAll(address operator, bool approved)',
	'function isApprovedForAll(address owner, address operator) view returns (bool)',
	'function transferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
	'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
	'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
	'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
];

/**
 * ERC-1155 ABI for multi-token operations
 */
export const ERC1155_ABI = [
	'function uri(uint256 id) view returns (string)',
	'function balanceOf(address account, uint256 id) view returns (uint256)',
	'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
	'function setApprovalForAll(address operator, bool approved)',
	'function isApprovedForAll(address account, address operator) view returns (bool)',
	'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
	'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
	'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
	'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
	'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
];
