/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * zkSync Era System Contract Addresses
 * These are protocol-level contracts at fixed addresses
 */
export const SYSTEM_CONTRACTS = {
	// Core System Contracts
	EMPTY_CONTRACT: '0x0000000000000000000000000000000000000000',
	ECRECOVER: '0x0000000000000000000000000000000000000001',
	SHA256: '0x0000000000000000000000000000000000000002',
	ECADD: '0x0000000000000000000000000000000000000006',
	ECMUL: '0x0000000000000000000000000000000000000007',
	ECPAIRING: '0x0000000000000000000000000000000000000008',
	
	// zkSync System Contracts (0x8000 - 0x8FFF range)
	BOOTLOADER_FORMAL: '0x0000000000000000000000000000000000008001',
	ACCOUNT_CODE_STORAGE: '0x0000000000000000000000000000000000008002',
	NONCE_HOLDER: '0x0000000000000000000000000000000000008003',
	KNOWN_CODES_STORAGE: '0x0000000000000000000000000000000000008004',
	IMMUTABLE_SIMULATOR: '0x0000000000000000000000000000000000008005',
	CONTRACT_DEPLOYER: '0x0000000000000000000000000000000000008006',
	FORCE_DEPLOYER: '0x0000000000000000000000000000000000008007',
	L1_MESSENGER: '0x0000000000000000000000000000000000008008',
	MSG_VALUE_SIMULATOR: '0x0000000000000000000000000000000000008009',
	ETH_TOKEN: '0x000000000000000000000000000000000000800A',
	SYSTEM_CONTEXT: '0x000000000000000000000000000000000000800B',
	BOOTLOADER_UTILITIES: '0x000000000000000000000000000000000000800C',
	COMPRESSOR: '0x000000000000000000000000000000000000800D',
	COMPLEX_UPGRADER: '0x000000000000000000000000000000000000800E',
	KECCAK256: '0x0000000000000000000000000000000000008010',
	PUBDATA_CHUNK_PUBLISHER: '0x0000000000000000000000000000000000008011',
	EVENT_WRITER: '0x000000000000000000000000000000000000800D',
} as const;

export type SystemContractName = keyof typeof SYSTEM_CONTRACTS;

/**
 * Get system contract info
 */
export function getSystemContractInfo(name: SystemContractName): { name: string; address: string; description: string } {
	const descriptions: Record<SystemContractName, string> = {
		EMPTY_CONTRACT: 'Empty contract placeholder',
		ECRECOVER: 'Elliptic curve signature recovery precompile',
		SHA256: 'SHA-256 hash precompile',
		ECADD: 'Elliptic curve addition precompile',
		ECMUL: 'Elliptic curve multiplication precompile',
		ECPAIRING: 'Elliptic curve pairing precompile',
		BOOTLOADER_FORMAL: 'Formal bootloader address',
		ACCOUNT_CODE_STORAGE: 'Stores account bytecode hashes',
		NONCE_HOLDER: 'Manages account nonces for transactions and deployments',
		KNOWN_CODES_STORAGE: 'Registry of known bytecode hashes',
		IMMUTABLE_SIMULATOR: 'Simulates immutable variables for system contracts',
		CONTRACT_DEPLOYER: 'Handles contract deployment logic',
		FORCE_DEPLOYER: 'Force deployment capabilities',
		L1_MESSENGER: 'Handles L1 to L2 messaging',
		MSG_VALUE_SIMULATOR: 'Simulates ETH transfers in system context',
		ETH_TOKEN: 'Native ETH token system contract',
		SYSTEM_CONTEXT: 'Provides block and chain context',
		BOOTLOADER_UTILITIES: 'Utilities for bootloader operations',
		COMPRESSOR: 'Handles data compression',
		COMPLEX_UPGRADER: 'Handles complex contract upgrades',
		KECCAK256: 'Keccak-256 hash precompile',
		PUBDATA_CHUNK_PUBLISHER: 'Publishes pubdata chunks to L1',
		EVENT_WRITER: 'Handles event emission',
	};

	return {
		name,
		address: SYSTEM_CONTRACTS[name],
		description: descriptions[name],
	};
}
