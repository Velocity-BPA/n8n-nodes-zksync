/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IPollFunctions,
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
} from 'n8n-workflow';

import { Provider } from 'zksync-ethers';
import { ethers } from 'ethers';
import { getNetworkConfig } from './constants/networks';
import { formatEther, isValidAddress } from './transport/zksyncClient';

export class ZkSyncTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'zkSync Era Trigger',
		name: 'zkSyncTrigger',
		icon: 'file:zksync.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["triggerOn"]}}',
		description: 'Triggers on zkSync Era blockchain events',
		defaults: {
			name: 'zkSync Era Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'zkSyncNetwork',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Trigger On',
				name: 'triggerOn',
				type: 'options',
				options: [
					{ name: 'New Block', value: 'newBlock', description: 'Trigger on each new L2 block' },
					{ name: 'New L1 Batch', value: 'newL1Batch', description: 'Trigger when new L1 batch is submitted' },
					{ name: 'Transaction Confirmed', value: 'transactionConfirmed', description: 'Trigger when transaction is confirmed' },
					{ name: 'ETH Received', value: 'ethReceived', description: 'Trigger when address receives ETH' },
					{ name: 'ETH Sent', value: 'ethSent', description: 'Trigger when address sends ETH' },
					{ name: 'Token Transfer', value: 'tokenTransfer', description: 'Trigger on ERC-20 token transfer' },
					{ name: 'NFT Transfer', value: 'nftTransfer', description: 'Trigger on NFT transfer' },
					{ name: 'Contract Event', value: 'contractEvent', description: 'Trigger on specific contract event' },
					{ name: 'Block Finalized', value: 'blockFinalized', description: 'Trigger when block is proven on L1' },
					{ name: 'Balance Change', value: 'balanceChange', description: 'Trigger when address balance changes' },
				],
				default: 'newBlock',
			},

			// Watch address for ETH transfers and balance changes
			{
				displayName: 'Watch Address',
				name: 'watchAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						triggerOn: ['ethReceived', 'ethSent', 'balanceChange'],
					},
				},
			},

			// Transaction hash for confirmation monitoring
			{
				displayName: 'Transaction Hash',
				name: 'txHash',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						triggerOn: ['transactionConfirmed'],
					},
				},
			},

			// Confirmations for transaction
			{
				displayName: 'Required Confirmations',
				name: 'confirmations',
				type: 'number',
				default: 1,
				displayOptions: {
					show: {
						triggerOn: ['transactionConfirmed'],
					},
				},
			},

			// Contract address for events
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x...',
				displayOptions: {
					show: {
						triggerOn: ['tokenTransfer', 'nftTransfer', 'contractEvent'],
					},
				},
			},

			// Event name for custom events
			{
				displayName: 'Event Name',
				name: 'eventName',
				type: 'string',
				default: 'Transfer',
				displayOptions: {
					show: {
						triggerOn: ['contractEvent'],
					},
				},
			},

			// Event ABI for custom events
			{
				displayName: 'Event ABI',
				name: 'eventAbi',
				type: 'string',
				default: 'event Transfer(address indexed from, address indexed to, uint256 value)',
				displayOptions: {
					show: {
						triggerOn: ['contractEvent'],
					},
				},
			},

			// Filter address for token/NFT transfers
			{
				displayName: 'Filter Address (Optional)',
				name: 'filterAddress',
				type: 'string',
				default: '',
				placeholder: '0x... (filter by from or to address)',
				displayOptions: {
					show: {
						triggerOn: ['tokenTransfer', 'nftTransfer'],
					},
				},
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const triggerOn = this.getNodeParameter('triggerOn') as string;
		const credentials = await this.getCredentials('zkSyncNetwork');
		const network = credentials.network as string;
		const customRpcUrl = credentials.customRpcUrl as string;

		const config = getNetworkConfig(network, customRpcUrl);
		const provider = new Provider(config.rpcUrl);

		const workflowStaticData = this.getWorkflowStaticData('node');

		const returnData: INodeExecutionData[] = [];

		switch (triggerOn) {
			case 'newBlock': {
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData.lastBlock as number) || currentBlock - 1;

					if (currentBlock > lastBlock) {
						for (let blockNum = lastBlock + 1; blockNum <= currentBlock; blockNum++) {
							const block = await provider.getBlock(blockNum);
							if (block) {
								returnData.push({
									json: {
										blockNumber: block.number,
										hash: block.hash,
										timestamp: block.timestamp,
										timestampDate: new Date(block.timestamp * 1000).toISOString(),
										gasLimit: block.gasLimit?.toString(),
										gasUsed: block.gasUsed?.toString(),
										transactionCount: block.transactions?.length || 0,
										network: config.name,
									},
								});
							}
						}
						workflowStaticData.lastBlock = currentBlock;
					}
					break;
				}

				case 'newL1Batch': {
					const currentBatch = await provider.getL1BatchNumber();
					const lastBatch = (workflowStaticData.lastL1Batch as number) || currentBatch - 1;

					if (currentBatch > lastBatch) {
						for (let batchNum = lastBatch + 1; batchNum <= currentBatch; batchNum++) {
							const details = await provider.getL1BatchDetails(batchNum);
							returnData.push({
								json: {
									batchNumber: details.number,
									timestamp: details.timestamp,
									l1TxCount: details.l1TxCount,
									l2TxCount: details.l2TxCount,
									rootHash: details.rootHash,
									status: details.status,
									commitTxHash: details.commitTxHash,
									proveTxHash: details.proveTxHash,
									executeTxHash: details.executeTxHash,
									network: config.name,
								},
							});
						}
						workflowStaticData.lastL1Batch = currentBatch;
					}
					break;
				}

				case 'transactionConfirmed': {
					const txHash = this.getNodeParameter('txHash') as string;
					const requiredConfirmations = this.getNodeParameter('confirmations') as number;
					const alreadyTriggered = workflowStaticData[`tx_${txHash}`] as boolean;

					if (!alreadyTriggered) {
						const receipt = await provider.getTransactionReceipt(txHash);
						if (receipt && receipt.blockNumber) {
							const currentBlock = await provider.getBlockNumber();
							const confirmations = currentBlock - receipt.blockNumber + 1;

							if (confirmations >= requiredConfirmations) {
								returnData.push({
									json: {
										hash: receipt.hash,
										status: receipt.status === 1 ? 'success' : 'failed',
										blockNumber: receipt.blockNumber,
										confirmations,
										from: receipt.from,
										to: receipt.to,
										gasUsed: receipt.gasUsed?.toString(),
										network: config.name,
									},
								});
								workflowStaticData[`tx_${txHash}`] = true;
							}
						}
					}
					break;
				}

				case 'ethReceived':
				case 'ethSent': {
					const watchAddress = this.getNodeParameter('watchAddress') as string;
					
					if (!isValidAddress(watchAddress)) {
						throw new Error('Invalid watch address');
					}

					const currentBlock = await provider.getBlockNumber();
					const lastCheckedBlock = (workflowStaticData.lastCheckedBlock as number) || currentBlock - 1;

					if (currentBlock > lastCheckedBlock) {
						for (let blockNum = lastCheckedBlock + 1; blockNum <= currentBlock; blockNum++) {
							const block = await provider.getBlock(blockNum, true);
							if (block && block.prefetchedTransactions) {
								for (const tx of block.prefetchedTransactions) {
									const isReceived = tx.to?.toLowerCase() === watchAddress.toLowerCase();
									const isSent = tx.from?.toLowerCase() === watchAddress.toLowerCase();

									if ((triggerOn === 'ethReceived' && isReceived) || (triggerOn === 'ethSent' && isSent)) {
										returnData.push({
											json: {
												type: triggerOn === 'ethReceived' ? 'received' : 'sent',
												hash: tx.hash,
												from: tx.from,
												to: tx.to,
												valueWei: tx.value?.toString(),
												valueEth: tx.value ? formatEther(tx.value) : '0',
												blockNumber: block.number,
												network: config.name,
											},
										});
									}
								}
							}
						}
						workflowStaticData.lastCheckedBlock = currentBlock;
					}
					break;
				}

				case 'tokenTransfer': {
					const contractAddress = this.getNodeParameter('contractAddress') as string;
					const filterAddress = this.getNodeParameter('filterAddress', '') as string;

					const currentBlock = await provider.getBlockNumber();
					const lastCheckedBlock = (workflowStaticData.lastTokenBlock as number) || currentBlock - 1;

					if (currentBlock > lastCheckedBlock) {
						// Transfer event topic (keccak256 of "Transfer(address,address,uint256)")
						const transferTopic = ethers.id('Transfer(address,address,uint256)');

						const logs = await provider.getLogs({
							address: contractAddress,
							topics: [transferTopic],
							fromBlock: lastCheckedBlock + 1,
							toBlock: currentBlock,
						});

						for (const log of logs) {
							const from = '0x' + log.topics[1].slice(26);
							const to = '0x' + log.topics[2].slice(26);
							const value = BigInt(log.data);

							// Apply filter if specified
							if (filterAddress) {
								const filterLower = filterAddress.toLowerCase();
								if (from.toLowerCase() !== filterLower && to.toLowerCase() !== filterLower) {
									continue;
								}
							}

							returnData.push({
								json: {
									type: 'tokenTransfer',
									contractAddress,
									from,
									to,
									value: value.toString(),
									blockNumber: log.blockNumber,
									transactionHash: log.transactionHash,
									logIndex: log.index,
									network: config.name,
								},
							});
						}
						workflowStaticData.lastTokenBlock = currentBlock;
					}
					break;
				}

				case 'nftTransfer': {
					const contractAddress = this.getNodeParameter('contractAddress') as string;
					const filterAddress = this.getNodeParameter('filterAddress', '') as string;

					const currentBlock = await provider.getBlockNumber();
					const lastCheckedBlock = (workflowStaticData.lastNftBlock as number) || currentBlock - 1;

					if (currentBlock > lastCheckedBlock) {
						// ERC-721 Transfer event topic
						const transferTopic = ethers.id('Transfer(address,address,uint256)');

						const logs = await provider.getLogs({
							address: contractAddress,
							topics: [transferTopic],
							fromBlock: lastCheckedBlock + 1,
							toBlock: currentBlock,
						});

						for (const log of logs) {
							// ERC-721 has tokenId in topics[3]
							if (log.topics.length >= 4) {
								const from = '0x' + log.topics[1].slice(26);
								const to = '0x' + log.topics[2].slice(26);
								const tokenId = BigInt(log.topics[3]);

								if (filterAddress) {
									const filterLower = filterAddress.toLowerCase();
									if (from.toLowerCase() !== filterLower && to.toLowerCase() !== filterLower) {
										continue;
									}
								}

								returnData.push({
									json: {
										type: 'nftTransfer',
										contractAddress,
										from,
										to,
										tokenId: tokenId.toString(),
										blockNumber: log.blockNumber,
										transactionHash: log.transactionHash,
										logIndex: log.index,
										network: config.name,
									},
								});
							}
						}
						workflowStaticData.lastNftBlock = currentBlock;
					}
					break;
				}

				case 'contractEvent': {
					const contractAddress = this.getNodeParameter('contractAddress') as string;
					const eventAbi = this.getNodeParameter('eventAbi') as string;

					const currentBlock = await provider.getBlockNumber();
					const lastCheckedBlock = (workflowStaticData.lastEventBlock as number) || currentBlock - 1;

					if (currentBlock > lastCheckedBlock) {
						const iface = new ethers.Interface([eventAbi]);
						// Get the first event from the interface
						const eventFragments = iface.fragments.filter(f => f.type === 'event');
						if (eventFragments.length > 0) {
							const eventFragment = eventFragments[0] as ethers.EventFragment;
							const eventTopic = eventFragment.topicHash;

							if (eventTopic) {
								const logs = await provider.getLogs({
									address: contractAddress,
									topics: [eventTopic],
									fromBlock: lastCheckedBlock + 1,
									toBlock: currentBlock,
								});

								for (const log of logs) {
									try {
										const decoded = iface.parseLog({
											topics: log.topics as string[],
											data: log.data,
										});

										const args: Record<string, string> = {};
										if (decoded && decoded.args) {
											decoded.fragment.inputs.forEach((input, index) => {
												const value = decoded.args[index];
												args[input.name] = typeof value === 'bigint' ? value.toString() : String(value);
											});
										}

										returnData.push({
											json: {
												type: 'contractEvent',
												eventName: decoded?.name,
												contractAddress,
												args,
												blockNumber: log.blockNumber,
												transactionHash: log.transactionHash,
												logIndex: log.index,
												network: config.name,
											},
										});
									} catch {
										// Skip logs that can't be decoded
									}
								}
							}
						}
						workflowStaticData.lastEventBlock = currentBlock;
					}
					break;
				}

				case 'blockFinalized': {
					const currentBatch = await provider.getL1BatchNumber();
					const lastCheckedBatch = (workflowStaticData.lastFinalizedBatch as number) || currentBatch - 10;

					// Check batches for finalization status
					for (let batchNum = lastCheckedBatch + 1; batchNum <= currentBatch; batchNum++) {
						const details = await provider.getL1BatchDetails(batchNum);
						const wasExecuted = workflowStaticData[`batch_executed_${batchNum}`] as boolean;

						if (details.status === 'verified' && details.executeTxHash && !wasExecuted) {
							returnData.push({
								json: {
									type: 'blockFinalized',
									batchNumber: details.number,
									status: details.status,
									commitTxHash: details.commitTxHash,
									proveTxHash: details.proveTxHash,
									executeTxHash: details.executeTxHash,
									network: config.name,
								},
							});
							workflowStaticData[`batch_executed_${batchNum}`] = true;
						}
					}
					workflowStaticData.lastFinalizedBatch = currentBatch;
					break;
				}

				case 'balanceChange': {
					const watchAddress = this.getNodeParameter('watchAddress') as string;
					
					if (!isValidAddress(watchAddress)) {
						throw new Error('Invalid watch address');
					}

					const currentBalance = await provider.getBalance(watchAddress);
					const lastBalance = workflowStaticData.lastBalance as string;

					if (lastBalance !== undefined && currentBalance.toString() !== lastBalance) {
						const previousBalance = BigInt(lastBalance);
						const change = currentBalance - previousBalance;

						returnData.push({
							json: {
								type: 'balanceChange',
								address: watchAddress,
								previousBalanceWei: lastBalance,
								previousBalanceEth: formatEther(previousBalance),
								currentBalanceWei: currentBalance.toString(),
								currentBalanceEth: formatEther(currentBalance),
								changeWei: change.toString(),
								changeEth: formatEther(change),
								direction: change > 0 ? 'increase' : 'decrease',
								network: config.name,
							},
						});
					}
					workflowStaticData.lastBalance = currentBalance.toString();
					break;
				}
			}

			if (returnData.length === 0) {
				return null;
			}

			return [returnData];
		}
}
