import React, { useMemo } from 'react';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { CommitActionEnum, SideEnum } from '@tracer-protocol/pools-js';
import { Logo, tokenSymbolToLogoTicker } from '~/components/General';
import Button from '~/components/General/Button';
import { TableRow, TableRowCell } from '~/components/General/TWTable';
import Actions from '~/components/TokenActions';
import { BlockExplorerAddressType } from '~/types/blockExplorers';
import { toApproxCurrency } from '~/utils/converters';
import { DenotedInEnum, TokenRowProps } from '../state';

export const TokenRow: React.FC<
    TokenRowProps & {
        onClickCommitAction: (pool: string, side: SideEnum, action: CommitActionEnum) => void;
        provider: ethers.providers.JsonRpcProvider | null;
        denotedIn: DenotedInEnum;
    }
> = ({
    symbol,
    name,
    address,
    poolAddress,
    decimals,
    side,
    price,
    holdings,
    provider,
    // deposits,
    onClickCommitAction,
    oraclePrice,
    denotedIn,
}) => {
    const netValue = useMemo(() => holdings.times(price), [holdings, price]);

    const BaseNumDenote = (netValue: BigNumber, oraclePrice: BigNumber, name: string, leverage?: number) => {
        if (netValue.eq(0)) {
            return netValue.toFixed(2);
        } else if (name.split('-')[1].split('/')[0] === 'BTC') {
            return leverage
                ? ((netValue.toNumber() / oraclePrice.toNumber()) * leverage).toFixed(8)
                : (netValue.toNumber() / oraclePrice.toNumber()).toFixed(8);
        } else if (name.split('-')[1].split('/')[0] === 'ETH') {
            return leverage
                ? ((netValue.toNumber() / oraclePrice.toNumber()) * leverage).toFixed(6)
                : (netValue.toNumber() / oraclePrice.toNumber()).toFixed(6);
        }
    };

    const NotionalDenote = (netValue: BigNumber, leverage?: number) => {
        return leverage ? toApproxCurrency(netValue.toNumber() * leverage) : toApproxCurrency(netValue);
    };

    return (
        <TableRow lined>
            <TableRowCell>
                {/*<div className="flex">*/}
                {/*    <Logo ticker={tokenSymbolToLogoTicker(symbol)} size="md" className="inline mr-2 my-auto" />*/}
                {/*    <div className="my-auto">*/}
                {/*        <div className="font-bold">{tickerToName(name)}</div>*/}
                {/*        <div className="text-xs">{name.split('-')[1]}</div>*/}
                {/*    </div>*/}
                {/*</div>*/}
                <div className="my-auto flex">
                    <Logo size="lg" ticker={tokenSymbolToLogoTicker(symbol)} className="my-auto mr-2 inline" />
                    <div>
                        <div className="flex">
                            <div>
                                {symbol.split('-')[0][0]}-
                                {symbol.split('-')[1].split('/')[0] === 'BTC' ? 'Bitcoin' : 'Ethereum'}
                            </div>
                            &nbsp;
                            <div className={`${side === SideEnum.long ? 'green' : 'red'}`}>
                                {side === SideEnum.long ? 'Long' : 'Short'}
                            </div>
                        </div>
                        <div className="text-cool-gray-500">{name} </div>
                    </div>
                </div>
            </TableRowCell>
            <TableRowCell>
                <div>
                    {
                        denotedIn === DenotedInEnum.BASE ? (
                            <>
                                {BaseNumDenote(netValue, oraclePrice, name)} {name.split('-')[1].split('/')[0]}
                            </>
                        ) : (
                            `${toApproxCurrency(netValue)} USD`
                        )
                        // TODO the above netValue is fine for stable coins but needs a conversion
                        //  rate for anything that is not 1/1 with USD
                    }
                </div>
                <div className="opacity-80">{holdings.toFixed(2)} tokens</div>
            </TableRowCell>
            <TableRowCell>
                AcquCosts
            </TableRowCell>
            <TableRowCell>
                PNL
            </TableRowCell>
            <TableRowCell>
                {denotedIn === DenotedInEnum.BASE ? (
                    <>
                        {BaseNumDenote(netValue, oraclePrice, name, parseInt(name.split('-')[0][0]))}{' '}
                        {name.split('-')[1].split('/')[0]}
                    </>
                ) : (
                    `${NotionalDenote(netValue, parseInt(name.split('-')[0][0]))} USD`
                )}
            </TableRowCell>
            <TableRowCell className="flex">
                <Button
                    className="mx-1 my-auto w-[70px] border-0 py-2 uppercase"
                    size="xs"
                    variant="primary-light"
                    disabled={!netValue.toNumber()}
                    onClick={() => onClickCommitAction(poolAddress, side, CommitActionEnum.burn)}
                >
                    Burn
                </Button>
                <Button
                    className="mx-1 my-auto w-[70px] border-0 py-2 uppercase"
                    size="xs"
                    variant="primary-light"
                    disabled={!netValue.toNumber()}
                    onClick={() => onClickCommitAction(poolAddress, side, CommitActionEnum.flip)}
                >
                    Flip
                </Button>
                <Actions
                    token={{
                        address,
                        symbol,
                        decimals,
                    }}
                    provider={provider}
                    arbiscanTarget={{
                        type: BlockExplorerAddressType.token,
                        target: address,
                    }}
                />
            </TableRowCell>
        </TableRow>
    );
};