/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZkSyncNetwork implements ICredentialType {
	name = 'zkSyncNetwork';
	displayName = 'zkSync Network';
	documentationUrl = 'https://docs.zksync.io/';
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			default: 'mainnet',
			options: [
				{
					name: 'Mainnet',
					value: 'mainnet',
				},
				{
					name: 'Sepolia Testnet',
					value: 'sepolia',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
		},
		{
			displayName: 'Custom RPC URL',
			name: 'customRpcUrl',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
			placeholder: 'https://your-rpc-endpoint.com',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your wallet private key (never share this!)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.network === "mainnet" ? "https://mainnet.era.zksync.io" : $credentials.network === "sepolia" ? "https://sepolia.era.zksync.dev" : $credentials.customRpcUrl}}',
			url: '/',
			method: 'POST',
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_chainId',
				params: [],
				id: 1,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
