import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import BigNumber from 'bignumber.js';
import shallow from 'zustand/shallow';
import { CommitActionEnum, SideEnum } from '@tracer-protocol/pools-js';
import { Logo, LogoTicker, Section, tokenSymbolToLogoTicker } from '~/components/General';
import NetworkHint, { NetworkHintContainer } from '~/components/NetworkHint';
import PageTable from '~/components/PageTable';
import { PoolStatusBadge } from '~/components/PoolStatusBadge';
import TooltipSelector, { TooltipKeys } from '~/components/Tooltips/TooltipSelector';
import { noDispatch, useSwapContext } from '~/context/SwapContext';
import useBrowsePools from '~/hooks/useBrowsePools';
import { useStore } from '~/store/main';
import { selectMarketSpotPrices } from '~/store/MarketSpotPricesSlice';
import { selectAccount } from '~/store/Web3Slice';
import { MarketFilterEnum, LeverageFilterEnum, SortByEnum } from '~/types/filters';
import { PoolStatus } from '~/types/pools';
import { formatSeconds, toApproxCurrency } from '~/utils/converters';
import { marketFilter } from '~/utils/filters';
import { escapeRegExp } from '~/utils/helpers';
import { getBaseAssetFromMarket, getMarketLeverage, marketSymbolToAssetName } from '~/utils/poolNames';
import FilterSelects from './FilterSelects';
import * as SimplePoolStyles from './styles';
import AddAltPoolModal from '../Pools/AddAltPoolModal';
import MintBurnModal from '../Pools/MintBurnModal';
// import PoolsTable from '../Pools/PoolsTable';
import { browseReducer, BrowseState, BrowseTableRowData, DeltaEnum, RebalanceEnum } from '../Pools/state';
import * as Styles from '../Pools/styles';
import MintModal from './MintModal';

export const SimpleBrowse = (): JSX.Element => {
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

    const handleMint = (pool: string, side: SideEnum) => {
        console.debug(`Minting ${side === SideEnum.long ? 'long' : 'short'} token from pool: ${pool}`);
        swapDispatch({ type: 'setSelectedPool', value: pool });
        swapDispatch({ type: 'setSide', value: side });
        swapDispatch({ type: 'setCommitAction', value: CommitActionEnum.mint });
        dispatch({ type: 'setMintBurnModalOpen', open: true });
    }

    return (
        <>
            <PageTable.Container>
                <div>
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
                </div>
                {isLoading ? <Styles.Loading /> : null}

                {Object.keys(groupedSortedFilteredTokens).map((key) => {
                    const poolTokens = groupedSortedFilteredTokens[key].filter(
                        (poolToken) => poolToken.poolStatus !== PoolStatus.Deprecated,
                    );
                    const bannerInfo = poolTokens[0];
                    // sum of grouped pool volume
                    const oneDayVolume = poolTokens.reduce(
                        (volume, row) => volume.plus(row.oneDayVolume),
                        new BigNumber(0),
                    );
                    return (
                        <>
                            <SimplePoolStyles.StyledMarketBanner>
                                <SimplePoolStyles.MarketBannerSection>
                                    <Logo
                                        className="my-auto mr-3"
                                        size="xl"
                                        ticker={getBaseAssetFromMarket(bannerInfo.marketSymbol) as LogoTicker}
                                    />
                                    <div>
                                        <SimplePoolStyles.MarketBannerTitle>
                                            {marketSymbolToAssetName[bannerInfo.marketSymbol] || 'MARKET TICKER'}
                                        </SimplePoolStyles.MarketBannerTitle>
                                        <SimplePoolStyles.MarketBannerText>
                                            {bannerInfo.marketSymbol}
                                        </SimplePoolStyles.MarketBannerText>
                                    </div>
                                </SimplePoolStyles.MarketBannerSection>
                                <SimplePoolStyles.MarketBannerSection>
                                    <SimplePoolStyles.MarketBannerTitle>Spot Price</SimplePoolStyles.MarketBannerTitle>
                                    <SimplePoolStyles.MarketBannerText>
                                        {marketSpotPrices[bannerInfo.marketSymbol]
                                            ? toApproxCurrency(marketSpotPrices[bannerInfo.marketSymbol])
                                            : '-'}
                                    </SimplePoolStyles.MarketBannerText>
                                </SimplePoolStyles.MarketBannerSection>
                                <SimplePoolStyles.MarketBannerSection>
                                    <SimplePoolStyles.MarketBannerTitle>24H Volume</SimplePoolStyles.MarketBannerTitle>
                                    <SimplePoolStyles.MarketBannerText>
                                        {toApproxCurrency(oneDayVolume)}
                                    </SimplePoolStyles.MarketBannerText>
                                </SimplePoolStyles.MarketBannerSection>
                                <SimplePoolStyles.MarketBannerControls />
                            </SimplePoolStyles.StyledMarketBanner>
                            <SimplePoolStyles.MarketWrapper>
                                <SimplePoolStyles.PoolSide>
                                    <SimplePoolStyles.PoolCards>
                                        {poolTokens.map((poolToken) => (
                                            <SimplePoolStyles.PoolCard>
                                                <div className="mb-2 flex">
                                                    <div className="flex">
                                                        <Logo
                                                            size="lg"
                                                            ticker={
                                                                getBaseAssetFromMarket(
                                                                    poolToken.marketSymbol,
                                                                ) as LogoTicker
                                                            }
                                                            className="my-auto mr-3"
                                                        />
                                                    </div>
                                                    <div className="my-auto">
                                                        <div className="font-semibold text-cool-gray-500 dark:text-cool-gray-400">
                                                            {marketSymbolToAssetName[poolToken.marketSymbol] ||
                                                                'MARKET TICKER'}
                                                        </div>
                                                        <div className="text-lg font-bold">
                                                            {poolToken.leverage}x {poolToken.marketSymbol}
                                                        </div>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <div className="text-right">
                                                            <span className="font-bold">Commit wait time: </span>
                                                            {formatSeconds(poolToken.minWaitTime)} ~{' '}
                                                            {formatSeconds(poolToken.maxWaitTime)}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-bold">Spot Price:</span>{' '}
                                                            {marketSpotPrices[poolToken.marketSymbol]
                                                                ? toApproxCurrency(
                                                                      marketSpotPrices[poolToken.marketSymbol],
                                                                  )
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
                                                        <div>
                                                            {toApproxCurrency(poolToken.shortToken.balancerPrice)}
                                                        </div>
                                                        <div>DEX Price</div>
                                                        <div>{toApproxCurrency(poolToken.longToken.balancerPrice)}</div>
                                                    </SimplePoolStyles.Section>
                                                    <SimplePoolStyles.PoolAmount
                                                        isShort={false}
                                                        height={(poolToken.longToken.tvl / poolToken.tvl) * 100}
                                                    />
                                                    <SimplePoolStyles.PoolAmount
                                                        isShort={true}
                                                        height={(poolToken.shortToken.tvl / poolToken.tvl) * 100}
                                                    />
                                                </SimplePoolStyles.PoolCardInfo>
                                                <SimplePoolStyles.TradeButtons>
                                                    <SimplePoolStyles.TradeButton isShort onClick={(e) => handleMint(poolToken.address, SideEnum.short)}>
                                                        {poolToken.shortToken.effectiveGain.toFixed(2)}x SHORT
                                                    </SimplePoolStyles.TradeButton>
                                                    <SimplePoolStyles.TradeButton onClick={(e) => handleMint(poolToken.address, SideEnum.long)}>
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
                <MintModal open={state.mintBurnModalOpen} onClose={handleMintBurnModalClose} />
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
