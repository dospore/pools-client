import { useEffect, useState } from 'react';
import { usePools } from '@context/PoolContext';
import { SideEnum } from '@libs/constants';

type TokenRow = {
    side: SideEnum;
    pool: string;
    symbol: string;
};
// const useTokens
export default (() => {
    const { pools } = usePools();
    const [tokens, setTokens] = useState<TokenRow[]>([]);

    useEffect(() => {
        if (pools && Object.values(pools).length) {
            const tokens: TokenRow[] = [];
            Object.values(pools).forEach((pool) => {
                tokens.push(
                    {
                        symbol: pool.shortToken.symbol,
                        side: SideEnum.short,
                        pool: pool.address,
                    },
                    {
                        symbol: pool.longToken.symbol,
                        side: SideEnum.long,
                        pool: pool.address,
                    },
                );
            });

            setTokens(tokens);
        }
    }, [pools]);

    return tokens;
}) as () => TokenRow[];