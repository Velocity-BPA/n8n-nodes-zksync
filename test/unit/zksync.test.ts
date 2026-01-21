/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { getNetworkConfig, NETWORKS } from '../../nodes/ZkSync/constants/networks';
import { SYSTEM_CONTRACTS } from '../../nodes/ZkSync/constants/systemContracts';
import { convertUnits, weiToEth, ethToWei, weiToGwei } from '../../nodes/ZkSync/utils/unitConverter';

describe('Network Configuration', () => {
	test('should return mainnet config', () => {
		const config = getNetworkConfig('mainnet');
		expect(config.chainId).toBe(324);
		expect(config.rpcUrl).toBe('https://mainnet.era.zksync.io');
	});

	test('should return sepolia config', () => {
		const config = getNetworkConfig('sepolia');
		expect(config.chainId).toBe(300);
		expect(config.rpcUrl).toBe('https://sepolia.era.zksync.dev');
		expect(config.testnetPaymaster).toBeDefined();
	});

	test('should return custom config', () => {
		const customUrl = 'https://custom-rpc.example.com';
		const config = getNetworkConfig('custom', customUrl);
		expect(config.rpcUrl).toBe(customUrl);
		expect(config.name).toBe('Custom Network');
	});

	test('should have all expected networks', () => {
		expect(NETWORKS.mainnet).toBeDefined();
		expect(NETWORKS.sepolia).toBeDefined();
	});
});

describe('System Contracts', () => {
	test('should have CONTRACT_DEPLOYER address', () => {
		expect(SYSTEM_CONTRACTS.CONTRACT_DEPLOYER).toBe('0x0000000000000000000000000000000000008006');
	});

	test('should have NONCE_HOLDER address', () => {
		expect(SYSTEM_CONTRACTS.NONCE_HOLDER).toBe('0x0000000000000000000000000000000000008003');
	});

	test('should have L1_MESSENGER address', () => {
		expect(SYSTEM_CONTRACTS.L1_MESSENGER).toBe('0x0000000000000000000000000000000000008008');
	});

	test('should have all system contract addresses as valid hex', () => {
		Object.values(SYSTEM_CONTRACTS).forEach((address) => {
			expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});
	});
});

describe('Unit Converter', () => {
	test('should convert ether to wei', () => {
		const result = convertUnits('1', 'ether', 'wei');
		expect(result).toBe('1000000000000000000');
	});

	test('should convert wei to ether', () => {
		const result = convertUnits('1000000000000000000', 'wei', 'ether');
		expect(result).toBe('1.0');
	});

	test('should convert gwei to wei', () => {
		const result = convertUnits('1', 'gwei', 'wei');
		expect(result).toBe('1000000000');
	});

	test('weiToEth should format correctly', () => {
		const result = weiToEth(BigInt('1000000000000000000'));
		expect(result).toBe('1.0');
	});

	test('ethToWei should parse correctly', () => {
		const result = ethToWei('1');
		expect(result).toBe(BigInt('1000000000000000000'));
	});

	test('weiToGwei should format correctly', () => {
		const result = weiToGwei(BigInt('1000000000'));
		expect(result).toBe('1.0');
	});
});

describe('Address Validation', () => {
	// Use zero address which is always valid
	test('should validate correct addresses', () => {
		const validAddress = '0x0000000000000000000000000000000000000000';
		expect(ethers.isAddress(validAddress)).toBe(true);
	});

	test('should reject invalid addresses', () => {
		const invalidAddress = '0xinvalid';
		expect(ethers.isAddress(invalidAddress)).toBe(false);
	});

	test('should reject empty string', () => {
		expect(ethers.isAddress('')).toBe(false);
	});

	test('should checksum address correctly', () => {
		// Use a well-known address with known checksum
		const lowercase = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
		const checksummed = ethers.getAddress(lowercase);
		expect(checksummed).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
	});
});

describe('ABI Encoding', () => {
	test('should encode uint256', () => {
		const abiCoder = ethers.AbiCoder.defaultAbiCoder();
		const encoded = abiCoder.encode(['uint256'], [100]);
		expect(encoded).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000064',
		);
	});

	test('should decode uint256', () => {
		const abiCoder = ethers.AbiCoder.defaultAbiCoder();
		const encoded = '0x0000000000000000000000000000000000000000000000000000000000000064';
		const decoded = abiCoder.decode(['uint256'], encoded);
		expect(decoded[0]).toBe(BigInt(100));
	});

	test('should encode address', () => {
		const abiCoder = ethers.AbiCoder.defaultAbiCoder();
		// Use a properly checksummed address (Vitalik's address)
		const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
		const encoded = abiCoder.encode(['address'], [address]);
		expect(encoded).toContain('d8da6bf26964af9d7eed9e03e53415d37aa96045');
	});
});

describe('Keccak256 Hashing', () => {
	test('should hash string correctly', () => {
		const hash = ethers.keccak256(ethers.toUtf8Bytes('hello'));
		expect(hash).toBe('0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8');
	});

	test('should hash empty string', () => {
		const hash = ethers.keccak256(ethers.toUtf8Bytes(''));
		expect(hash).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
	});
});
