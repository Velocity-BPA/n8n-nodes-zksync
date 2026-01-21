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

export class ZkSyncApi implements ICredentialType {
	name = 'zkSyncApi';
	displayName = 'zkSync API';
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
			displayName: 'Explorer API URL',
			name: 'explorerApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://block-explorer-api.mainnet.zksync.io',
			description: 'Optional explorer API URL for enhanced features',
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
