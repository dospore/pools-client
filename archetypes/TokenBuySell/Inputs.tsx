import React, { useEffect } from 'react';
import { SideEnum } from '@tracer-protocol/pools-js';
import { LogoTicker } from '~/components/General';
import { Dropdown } from '~/components/General/Dropdown';
import TWButtonGroup from '~/components/General/TWButtonGroup';
import { TooltipKeys } from '~/components/Tooltips/TooltipSelector';
import { Market, SIDE_OPTIONS } from '~/context/SwapContext';
import { SwapAction } from '~/context/SwapContext';
import { getBaseAssetFromMarket } from '~/utils/poolNames';

const marketToLeverage = (markets: Record<string, Market>) => {
    const leverageAmounts: string[] = [];
    Object.keys(markets).forEach((market) => {
        const options = Object.keys(markets[market]);
        if (options.length > 1) {
            options.forEach((option) => !leverageAmounts.includes(option) && leverageAmounts.push(option));
        } else {
            !leverageAmounts.includes(options[0]) && leverageAmounts.push(options[0]);
        }
    });
    return leverageAmounts;
};

const hasLeverageOption = (option: string, markets: Record<string, Market>, market: string) => {
    return Object.keys(markets[market]).includes(option);
};

export type MarketDropdownProps = {
    market: string;
    markets: Record<string, Market>;
    swapDispatch: React.Dispatch<SwapAction>;
};

export const MarketDropdown: React.FC<MarketDropdownProps> = ({ market, markets, swapDispatch }) => {
    useEffect(() => {
        swapDispatch({ type: 'setPoolFromMarket', market: market as string });
    }, [markets]);

    return (
        <Dropdown
            className="w-full"
            placeHolder="Select Market"
            placeHolderIcon={getBaseAssetFromMarket(market) as LogoTicker}
            size="lg"
            options={Object.keys(markets).map((market) => ({
                key: market,
                ticker: getBaseAssetFromMarket(market) as LogoTicker,
                text: market,
            }))}
            value={market}
            onSelect={(selectedMarket) => {
                swapDispatch({ type: 'setPoolFromMarket', market: selectedMarket as string });
            }}
        />
    );
};

export type SideSelectorProps = {
    side: SideEnum;
    swapDispatch: React.Dispatch<SwapAction>;
};

export const SideSelector: React.FC<SideSelectorProps> = ({ side, swapDispatch }) => {
    return (
        <TWButtonGroup
            value={side}
            fullWidth
            onClick={(option) => swapDispatch({ type: 'setSide', value: option as SideEnum })}
            size={'lg'}
            borderColor={'tracer'}
            options={SIDE_OPTIONS}
        />
    );
};

export type LeverageSelectorProps = {
    leverage: number;
    market: string;
    markets: Record<string, Market>;
    swapDispatch: React.Dispatch<SwapAction>;
};

export const LeverageSelector: React.FC<LeverageSelectorProps> = ({ leverage, market, markets, swapDispatch }) => {
    const LEVERAGE_OPTIONS = marketToLeverage(markets);
    const DEFAULT_OPTIONS = ['3', '10']; // Placeholder while waiting for correct options to load
    const SELECTOR_OPTIONS = LEVERAGE_OPTIONS && LEVERAGE_OPTIONS.length > 0 ? LEVERAGE_OPTIONS : DEFAULT_OPTIONS;
    return (
        <TWButtonGroup
            fullWidth
            value={leverage}
            borderColor={'tracer'}
            options={SELECTOR_OPTIONS.map((option) => ({
                key: parseInt(option),
                text: option.toString(),
                disabled: market
                    ? markets && !hasLeverageOption(option, markets, market)
                        ? {
                              optionKey: TooltipKeys.Unavailable,
                          }
                        : undefined
                    : {
                          optionKey: TooltipKeys.Unavailable,
                      }
                    ? { optionKey: TooltipKeys.SelectMarket }
                    : undefined,
            }))}
            onClick={(index) => {
                swapDispatch({ type: 'setLeverage', value: index });
                swapDispatch({ type: 'setPoolFromLeverage', value: index });
            }}
        />
    );
};