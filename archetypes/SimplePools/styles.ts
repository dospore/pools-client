import styled from 'styled-components';
import Button from '~/components/General/Button';

export const PoolCards = styled.div`
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr 1fr;
`

export const PoolCard = styled.div<{ isShort?: boolean }>`
    background: ${({ theme }) => theme.background.primary};
    padding: 1rem;
`

export const PoolCardInfo = styled.div`
    position: relative;
`

export const TradeButtons = styled.div`
    display: flex;
    justify-content: between;
    gap: 1rem;
    margin-top: 0.5rem;
`

export const TradeButton = styled.button<{ isShort?: boolean }>`
    width: 100%;
    background-color: ${({ isShort }) => (isShort ? '#ef4444' : '#10b981')};
    border-radius: 2px;
    padding: 0.2rem 0.5rem;
    opacity: 0.9;
    transition: 0.15s;
    &:hover {
        opacity: 1;
    }
`

export const PoolSide = styled.div`
    width: 100%;
    &:first-child {
        margin-right: 1rem;
    }
`

export const MarketWrapper = styled.div`
    display: flex;
    margin-bottom: 2rem;
`

export const StyledMarketBanner = styled.div`
    display: flex;
    margin-top: 2rem;
`

export const Section = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;

    div:nth-child(2) {
        font-weight: bold;
        text-align: center;
    }

    div:last-child {
        text-align: right;
    }
`

export const CenterText = styled.div`

`

export const PoolAmount = styled.div<{ isShort: boolean, height: number }>`
    height: ${({ height }) => height}%;
    background-color: ${({ isShort }) => (isShort ? '#ef44441a' : '#10b9811a')};
    position: absolute;
    width: 50%;
    left: ${({ isShort }) => (isShort ? 0 : 'auto')};
    right: ${({ isShort }) => (isShort ? 'auto' : 0)};
    bottom: 0;
`

export const StatusWrapper = styled.div`
    position: absolute;
    right: 1rem;
    top: -1rem;
`
