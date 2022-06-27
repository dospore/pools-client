import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import BigNumber from 'bignumber.js';
import { CommitActionEnum, SideEnum } from '@tracer-protocol/pools-js';
import NetworkHint, { NetworkHintContainer } from '~/components/NetworkHint';
import PageTable from '~/components/PageTable';
import TooltipSelector, { TooltipKeys } from '~/components/Tooltips/TooltipSelector';
import { noDispatch, useSwapContext } from '~/context/SwapContext';
import useBrowsePools from '~/hooks/useBrowsePools';
import { useStore } from '~/store/main';
import { selectAccount } from '~/store/Web3Slice';
import { MarketFilterEnum, LeverageFilterEnum, SortByEnum } from '~/types/filters';
import { marketFilter } from '~/utils/filters';
import { escapeRegExp } from '~/utils/helpers';
import { getBaseAssetFromMarket, getMarketLeverage, marketSymbolToAssetName } from '~/utils/poolNames';
import AddAltPoolModal from '../Pools/AddAltPoolModal';
import FilterSelects from '../Pools/FilterSelects';
import MintBurnModal from '../Pools/MintBurnModal';
// import PoolsTable from '../Pools/PoolsTable';
import { browseReducer, BrowseState, BrowseTableRowData, DeltaEnum, RebalanceEnum } from '../Pools/state';
import * as Styles from '../Pools/styles';
import * as SimplePoolStyles from './styles';
import {Logo, LogoTicker, Section, tokenSymbolToLogoTicker} from '~/components/General';
import {formatSeconds, toApproxCurrency} from '~/utils/converters';
import { PoolStatusBadge, PoolStatusBadgeContainer } from '~/components/PoolStatusBadge';
import {selectMarketSpotPrices} from '~/store/MarketSpotPricesSlice';
import shallow from 'zustand/shallow';

export const SimpleBrowse = ():JSX.Element => {
    const account = useStore(selectAccount);
    const { swapDispatch = noDispatch } = useSwapContext();
    const { rows: tokens, isLoading } = useBrowsePools();
    const marketSpotPrices = useStore(selectMarketSpotPrices, shallow);

    const [state, dispatch] = useReducer(browseReducer, {
        search: '',
        marketFilter: MarketFilterEnum.All,
        leverageFilter: LeverageFilterEnum.All,
        rebalanceFocus: RebalanceEnum.next,
        sortBy: account ? SortByEnum.MyHoldings : SortByEnum.Name,
        filtersOpen: false,
        mintBurnModalOpen: false,
        addAltPoolModalOpen: false,
        deltaDenotation: DeltaEnum.Percentile,
    } as BrowseState);

    useEffect(() => {
        if (account && state.sortBy === SortByEnum.Name) {
            dispatch({ type: 'setSortBy', sortBy: SortByEnum.MyHoldings });
        }
    }, [account]);

    const leverageFilter = useCallback(
        (pool: BrowseTableRowData): boolean => {
            switch (state.leverageFilter) {
                case LeverageFilterEnum.All:
                    return true;
                default:
                    return !!pool.name && getMarketLeverage(pool.name).toString() === state.leverageFilter;
            }
        },
        [state.leverageFilter],
    );

    const searchFilter = useCallback(
        (pool: BrowseTableRowData): boolean => {
            const searchString = escapeRegExp(state.search.toLowerCase());
            return Boolean(
                pool.name.toLowerCase().match(searchString) ||
                    pool.shortToken.symbol.toLowerCase().match(searchString) ||
                    pool.longToken.symbol.toLowerCase().match(searchString) ||
                    pool.marketSymbol.toLowerCase().match(searchString),
            );
        },
        [state.search],
    );

    const sorter = useCallback(
        (poolA: BrowseTableRowData, poolB: BrowseTableRowData): number => {
            switch (state.sortBy) {
                case SortByEnum.TotalValueLocked:
                    return poolB.tvl - poolA.tvl;
                case SortByEnum.MyHoldings:
                    return poolB.myHoldings - poolA.myHoldings;
                default:
                    return 0;
            }
        },
        [state.sortBy],
    );

    const filteredTokens: BrowseTableRowData[] = useMemo(
        () =>
            tokens
                .filter((pool) => marketFilter(pool.name, state.marketFilter))
                .filter(leverageFilter)
                .filter(searchFilter)
                .sort(sorter),
        [state.marketFilter, state.leverageFilter, state.search, state.sortBy, tokens],
    );

    const groupedSortedFilteredTokens = useMemo(
        () =>
            filteredTokens.reduce((groups, token) => {
                // @ts-ignore
            const group = groups[token.marketSymbol] || [];
                group.push(token);
                // @ts-ignore
                groups[token.marketSymbol] = group;
                return groups;
            }, {} as Record<string, BrowseTableRowData[]>),
        [filteredTokens],
    );

    const handleMintBurn = useCallback((pool: string, side: SideEnum, commitAction: CommitActionEnum) => {
        console.debug(`
            ${commitAction === CommitActionEnum.mint ? 'Buying/minting ' : 'Burning/selling '}
            ${side === SideEnum.long ? 'long' : 'short'} token from pool ${pool}
        `);
        swapDispatch({ type: 'setSelectedPool', value: pool });
        swapDispatch({ type: 'setSide', value: side });
        swapDispatch({ type: 'setCommitAction', value: commitAction });
        dispatch({ type: 'setMintBurnModalOpen', open: true });
    }, []);

    const handleAltModalClose = useCallback(() => dispatch({ type: 'setAddAltPoolModalOpen', open: false }), []);
    const handleMintBurnModalClose = useCallback(() => dispatch({ type: 'setMintBurnModalOpen', open: false }), []);

    const showNextRebalance = useMemo(() => state.rebalanceFocus === RebalanceEnum.next, [state.rebalanceFocus]);

    return (
        <>
            <PageTable.Container>
                <PageTable.Header>
                    <div>
                        <PageTable.Heading>
                            <NetworkHintContainer>
                                Pools
                                <NetworkHint />
                            </NetworkHintContainer>
                        </PageTable.Heading>
                        <PageTable.SubHeading>
                            Unlocking Perpetual Pools v2 - take part in the Tracer Voyage to experience the true power
                            of DeFi.{' '}
                            <PageTable.Link href="https://tracer.finance/radar/the-tracer-voyage/">
                                Learn More.
                            </PageTable.Link>
                        </PageTable.SubHeading>
                    </div>
                    <FilterSelects state={state} dispatch={dispatch} />
                </PageTable.Header>
                {isLoading ? <Styles.Loading /> : null}

                {Object.keys(groupedSortedFilteredTokens).map((key) => {
                    const poolTokens = groupedSortedFilteredTokens[key] as BrowseTableRowData[];
                    // sum of grouped pool volume
                    // const oneDayVolume = poolTokens.reduce(
                        // (volume, row) => volume.plus(row.oneDayVolume),
                        // new BigNumber(0),
                    // );
                    return (

                        <>
                        <MarketBanner 
                            marketInfo={poolTokens[0]}
                            side="Long"
                        />
                        <SimplePoolStyles.MarketWrapper>
                            <SimplePoolStyles.PoolSide>
                                <SimplePoolStyles.PoolCards>
                                    {poolTokens.map((poolToken) => (
                                        <SimplePoolStyles.PoolCard>
                                            <div className="flex mb-2">
                                                <div className="flex">
                                                    <Logo size="xl" ticker={getBaseAssetFromMarket(poolToken.marketSymbol) as LogoTicker} className="my-auto mr-3" />
                                                </div>
                                                <div className="my-auto">
                                                    <div className="font-semibold text-cool-gray-500 dark:text-cool-gray-400">
                                                        {marketSymbolToAssetName[poolToken.marketSymbol] || 'MARKET TICKER'}
                                                    </div>
                                                    <div className="text-lg font-bold">{poolToken.leverage}x {poolToken.marketSymbol}</div>
                                                </div>
                                                <div className="ml-auto">
                                                    <div className="text-right">
                                                        <span className="font-bold">Commit wait time: </span>{formatSeconds(poolToken.minWaitTime)} ~ {formatSeconds(poolToken.maxWaitTime)}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold">Spot Price:</span> {marketSpotPrices[poolToken.marketSymbol]
                                                            ? toApproxCurrency(marketSpotPrices[poolToken.marketSymbol])
                                                            : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                            <SimplePoolStyles.PoolCardInfo>
                                                <SimplePoolStyles.Section>
                                                    <div>{toApproxCurrency(poolToken.shortToken.tvl)}</div>
                                                    <div>TVL</div>
                                                    <div>{toApproxCurrency(poolToken.longToken.tvl)}</div>
                                                </SimplePoolStyles.Section>
                                                <SimplePoolStyles.Section>
                                                    <div>{toApproxCurrency(poolToken.shortToken.nextTCRPrice)}</div>
                                                    <div>TCR Price</div>
                                                    <div>{toApproxCurrency(poolToken.longToken.nextTCRPrice)}</div>
                                                </SimplePoolStyles.Section>
                                                <SimplePoolStyles.Section>
                                                    <div>{toApproxCurrency(poolToken.shortToken.balancerPrice)}</div>
                                                    <div>DEX Price</div>
                                                    <div>{toApproxCurrency(poolToken.longToken.balancerPrice)}</div>
                                                </SimplePoolStyles.Section>
                                                <SimplePoolStyles.PoolAmount isShort={false} height={(poolToken.longToken.tvl / poolToken.tvl) * 100} />
                                                <SimplePoolStyles.PoolAmount isShort={true} height={(poolToken.shortToken.tvl / poolToken.tvl) * 100} />
                                            </SimplePoolStyles.PoolCardInfo>
                                            <SimplePoolStyles.TradeButtons>
                                                <SimplePoolStyles.TradeButton isShort>
                                                    {poolToken.shortToken.effectiveGain.toFixed(2)}x SHORT
                                                </SimplePoolStyles.TradeButton>
                                                <SimplePoolStyles.TradeButton>
                                                    {poolToken.longToken.effectiveGain.toFixed(2)}x LONG
                                                </SimplePoolStyles.TradeButton>
                                            </SimplePoolStyles.TradeButtons>
                                        </SimplePoolStyles.PoolCard>
                                    ))}
                                </SimplePoolStyles.PoolCards>
                            </SimplePoolStyles.PoolSide>
                        </SimplePoolStyles.MarketWrapper>
                        </>
                    );
                })}
                <Styles.AltPoolRow>
                    <Styles.AltPoolTitle>Don’t see the pool you’re after?</Styles.AltPoolTitle>
                    <Styles.AltPoolActions>
                        <Styles.Button
                            variant="primary"
                            size="sm"
                            onClick={() => dispatch({ type: 'setAddAltPoolModalOpen', open: true })}
                        >
                            Display Alternative Pool
                        </Styles.Button>
                        <TooltipSelector tooltip={{ key: TooltipKeys.ComingSoon }}>
                            <Styles.DisabledButtonWrap>
                                <Styles.DummyButton />
                                <Styles.Button variant="primary" size="sm" disabled>
                                    Deploy New Pool
                                </Styles.Button>
                            </Styles.DisabledButtonWrap>
                        </TooltipSelector>
                    </Styles.AltPoolActions>
                </Styles.AltPoolRow>
            </PageTable.Container>
            {state.mintBurnModalOpen && (
                <MintBurnModal open={state.mintBurnModalOpen} onClose={handleMintBurnModalClose} />
            )}
            {state.addAltPoolModalOpen && (
                <AddAltPoolModal
                    open={state.addAltPoolModalOpen}
                    onClose={handleAltModalClose}
                    sortedFilteredTokens={filteredTokens}
                />
            )}
        </>
    );
};

type PoolTokenProps = {
    marketInfo: BrowseTableRowData;
    tokenInfo: BrowseTableRowData['longToken'] | BrowseTableRowData['shortToken'];
    isShort: boolean;
}

const PoolToken = ({ marketInfo, tokenInfo, isShort }: PoolTokenProps): JSX.Element => {
    return (
        <SimplePoolStyles.PoolCard isShort={isShort}>
            <PoolStatusBadge status={tokenInfo.poolStatus} />
            <SimplePoolStyles.PoolCardInfo>
                <div className="flex mb-4">
                    <div className="flex">
                        <Logo size="xl" ticker={tokenSymbolToLogoTicker(tokenInfo.symbol)} className="my-auto mr-3" />
                    </div>
                    <div className="my-auto">
                        <div className="font-semibold text-cool-gray-500 dark:text-cool-gray-400">
                            {marketSymbolToAssetName[marketInfo.marketSymbol] || 'MARKET TICKER'}
                        </div>
                        <div className="text-lg font-bold">{marketInfo.leverage}x {tokenInfo.side} {marketInfo.marketSymbol}</div>
                    </div>
                </div>
                <Section label='TVL'>{toApproxCurrency(tokenInfo.tvl)}</Section>
                <Section label='Commit wait time'>{formatSeconds(marketInfo.minWaitTime)} ~ {formatSeconds(marketInfo.maxWaitTime)}</Section>
                <Section label='Price on TCR'>{toApproxCurrency(tokenInfo.nextTCRPrice)}/token</Section>
                <Section label='Price on Balancer'>{toApproxCurrency(tokenInfo.balancerPrice)}/token</Section>
                <SimplePoolStyles.TradeButtons>
                    <SimplePoolStyles.TradeButton isShort>
                        BURN
                    </SimplePoolStyles.TradeButton>
                    <SimplePoolStyles.TradeButton>
                        {tokenInfo.effectiveGain.toFixed(2)}x MINT
                    </SimplePoolStyles.TradeButton>
                </SimplePoolStyles.TradeButtons>
            </SimplePoolStyles.PoolCardInfo>
        </SimplePoolStyles.PoolCard>
    )
}

type MarketBannerProps = {
    marketInfo: BrowseTableRowData;
    side: 'Long' | 'Short';
}

const MarketBanner = ({ marketInfo }: MarketBannerProps): JSX.Element => {
    return (
        <SimplePoolStyles.StyledMarketBanner className="flex pr-10">
            <div className="flex">
                <Logo
                    className="my-auto mr-3"
                    size="lg"
                    ticker={getBaseAssetFromMarket(marketInfo.marketSymbol) as LogoTicker}
                />
            </div>
            <div className="my-auto">
                <div className="font-semibold text-cool-gray-500 dark:text-cool-gray-400">
                    {marketSymbolToAssetName[marketInfo.marketSymbol] || 'MARKET TICKER'}
                </div>
                <div className="text-lg font-bold">{marketInfo.marketSymbol}</div>
            </div>
        </SimplePoolStyles.StyledMarketBanner>
    )
}
