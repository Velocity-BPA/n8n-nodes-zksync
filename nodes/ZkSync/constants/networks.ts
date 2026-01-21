/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface NetworkConfig {
	name: string;
	chainId: number;
	rpcUrl: string;
	explorerUrl: string;
	explorerApiUrl: string;
	l1ChainId: number;
	l1RpcUrl: string;
	bridgeAddress: string;
	testnetPaymaster?: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
	mainnet: {
		name: 'zkSync Era Mainnet',
		chainId: 324,
		rpcUrl: 'https://mainnet.era.zksync.io',
		explorerUrl: 'https://explorer.zksync.io',
		explorerApiUrl: 'https://block-explorer-api.mainnet.zksync.io',
		l1ChainId: 1,
		l1RpcUrl: 'https://ethereum.publicnode.com',
		bridgeAddress: '0x32400084C286CF3E17e7B677ea9583e60a000324',
	},
	sepolia: {
		name: 'zkSync Era Sepolia Testnet',
		chainId: 300,
		rpcUrl: 'https://sepolia.era.zksync.dev',
		explorerUrl: 'https://sepolia.explorer.zksync.io',
		explorerApiUrl: 'https://block-explorer-api.sepolia.zksync.dev',
		l1ChainId: 11155111,
		l1RpcUrl: 'https://ethereum-sepolia.publicnode.com',
		bridgeAddress: '0x9A6DE0f62Aa270A8bCB1e2610078650D539B1Ef9',
		testnetPaymaster: '0x3cb2b87d10ac01736a65688f3e0fb1b070b3eea3',
	},
};

export function getNetworkConfig(network: string, customRpcUrl?: string): NetworkConfig {
	if (network === 'custom' && customRpcUrl) {
		return {
			name: 'Custom Network',
			chainId: 0,
			rpcUrl: customRpcUrl,
			explorerUrl: '',
			explorerApiUrl: '',
			l1ChainId: 0,
			l1RpcUrl: '',
			bridgeAddress: '',
		};
	}
	return NETWORKS[network] || NETWORKS.mainnet;
}
