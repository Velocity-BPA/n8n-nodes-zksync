/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZkSyncPaymaster implements ICredentialType {
	name = 'zkSyncPaymaster';
	displayName = 'zkSync Paymaster';
	documentationUrl = 'https://docs.zksync.io/build/developer-reference/account-abstraction/paymasters';
	properties: INodeProperties[] = [
		{
			displayName: 'Paymaster Type',
			name: 'paymasterType',
			type: 'options',
			default: 'testnet',
			options: [
				{
					name: 'Testnet Paymaster',
					value: 'testnet',
					description: 'Use official zkSync testnet paymaster',
				},
				{
					name: 'Custom Paymaster',
					value: 'custom',
					description: 'Use your own paymaster contract',
				},
			],
		},
		{
			displayName: 'Paymaster Address',
			name: 'paymasterAddress',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					paymasterType: ['custom'],
				},
			},
			placeholder: '0x...',
			description: 'Your custom paymaster contract address',
		},
		{
			displayName: 'Gas Token Address',
			name: 'gasTokenAddress',
			type: 'string',
			default: '',
			placeholder: '0x...',
			description: 'ERC-20 token address for gas payment (optional)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};
}
