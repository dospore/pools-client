import React, { useContext, useState, useMemo } from 'react';
import { TWModal } from '~/components/General/TWModal';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { BalanceTypeEnum, CommitActionEnum, SideEnum } from '@tracer-protocol/pools-js';
import Divider from '~/components/General/Divider';
import TWButtonGroup from '~/components/General/TWButtonGroup';
import { NetworkHintContainer, NetworkHint } from '~/components/NetworkHint';
import { CommitActionSideMap } from '~/constants/commits';
import { noDispatch, SwapContext, swapDefaults, useBigNumber } from '~/context/SwapContext';
import useBalancerETHPrice from '~/hooks/useBalancerETHPrice';
import useExpectedCommitExecution from '~/hooks/useExpectedCommitExecution';
import { useGasPrice } from '~/hooks/useGasPrice';
import { usePool } from '~/hooks/usePool';
import { usePoolInstanceActions } from '~/hooks/usePoolInstanceActions';
import CloseIcon from '~/public/img/general/close.svg';
import { useStore } from '~/store/main';
import { selectAccount, selectHandleConnect } from '~/store/Web3Slice';

import { formatBN } from '~/utils/converters';
import Gas from '../../Exchange/Gas';
import Summary from '~/archetypes/Exchange/Summary';
import Inputs from '~/archetypes/Exchange/Inputs';
import {Logo} from '~/components/General';
import AmountInput from '~/archetypes/Exchange/Inputs/AmountInput';

const DEFAULT_GAS_FEE = new BigNumber(0);

export default (({ open, onClose }) => {
    // const account = useStore(selectAccount);
    // const handleConnect = useStore(selectHandleConnect);
    const gasPrice = useGasPrice();

    const { swapState = swapDefaults, swapDispatch = noDispatch } = useContext(SwapContext);
    const { selectedPool, amount, commitAction, side, invalidAmount, balanceType } = swapState || {};
    const { poolInstance: pool, userBalances, poolStatus } = usePool(selectedPool);
    const { commit, approve, commitGasFee } = usePoolInstanceActions();

    const ethPrice = useBalancerETHPrice();

    const [commitGasFees, setCommitGasFees] = useState<Partial<Record<CommitActionEnum, BigNumber>>>({});

    const commitType = CommitActionSideMap[commitAction][side];

    const receiveIn = useExpectedCommitExecution(pool.lastUpdate, pool.updateInterval, pool.frontRunningInterval);
    const amountBN = useBigNumber(amount);

    useMemo(async () => {
        if (commitGasFee) {
            const fee: BigNumber | undefined = await commitGasFee(
                selectedPool ?? '',
                commitType,
                swapState.balanceType,
                amountBN,
            ).catch((_err) => undefined);
            if (fee) {
                const gasPriceInEth = formatBN(new BigNumber(gasPrice ?? 0), 9);
                const costInEth = fee.times(gasPriceInEth);
                setCommitGasFees({ ...commitGasFees, [commitAction]: ethPrice.times(costInEth) });
            }
        }
    }, [selectedPool, commitType, amountBN, ethPrice, gasPrice]);

    const settlementTokenBalance = useMemo(() => {
        switch (balanceType) {
            case BalanceTypeEnum.escrow:
                return userBalances.aggregateBalances.settlementTokens;
            default:
                return userBalances.settlementToken.balance;
        }
    }, [balanceType, userBalances.settlementToken, userBalances.aggregateBalances.settlementTokens]);

    return (
        <TWModal open={open} onClose={onClose} className="px-4 pt-4 pb-5 sm:px-16 sm:pb-20 sm:pt-7 md:max-w-[611px]">

            <Close onClick={onClose} className="close" />
            <Title>
                <NetworkHintContainer>
                    Minting Token
                    <NetworkHint />
                </NetworkHintContainer>
            </Title>

            <Header>
                <Gas />
            </Header>

            <DividerRow />


            <AmountInput 
                invalidAmount={invalidAmount}
                amount={amount}
                amountBN={amountBN}
                balance={settlementTokenBalance}
                tokenSymbol={pool.settlementToken.symbol}
                swapDispatch={swapDispatch}
                selectedPool={selectedPool}
                isPoolToken={false}
            />


            <Summary
                pool={pool}
                showBreakdown={!invalidAmount.isInvalid}
                isLong={side === SideEnum.long}
                amount={amountBN}
                receiveIn={receiveIn}
                commitAction={commitAction}
                gasFee={commitGasFees[commitAction] ?? DEFAULT_GAS_FEE}
            />
        </TWModal>
    );
}) as React.FC<{
    open: boolean;
    onClose: () => any;
}>;

const Title = styled.h2`
    font-weight: 600;
    font-size: 20px;
    color: ${({ theme }) => theme.fontColor.primary};
    margin-bottom: 15px;

    @media (min-width: 640px) {
        margin-bottom: 20px;
    }
`;

const Close = styled(CloseIcon)`
    position: absolute;
    right: 1rem;
    top: 1.6rem;
    width: 0.75rem;
    height: 0.75rem;
    cursor: pointer;

    @media (min-width: 640px) {
        right: 4rem;
        top: 3.8rem;
        width: 1rem;
        height: 1rem;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
`;

const DividerRow = styled(Divider)`
    margin: 30px 0;
    border-color: ${({ theme }) => theme.border.secondary};
`;
