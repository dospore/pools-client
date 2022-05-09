import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { classNames } from '~/utils/helpers';
import {Theme} from '~/store/ThemeSlice/themes';

const POOLTOKEN = 0;
const BPT = 1;

const StyledFarmNav = styled.div`
    position: relative;
    display: flex;
    width: 100%;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    text-align: center;
    background: ${({ theme }) => {
        switch (theme.theme) {
            case Theme.Matrix:
                return 'transparent';
            default: 
                return theme.background.tertiary;
        }
    }};
`

const NavLinks = styled.div`
    display: flex;
    justify-content: center;
    flex-grow: 1;
`

const Item = styled.div`
    display: inline;
    min-width: 130px;
    margin: auto 0.5rem;
    padding:  0.375rem 0.75rem;
    color: ${({ theme }) => theme.fontColor.primary};
    cursor: pointer;
    border-radius: 0.75rem;
    transition: all cubic-bezier(0.4, 0, 0.2, 1) 150ms;
    &:hover {
        background: ${({ theme }) => theme.background.secondary};
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
    &.selected {
        background: ${({ theme }) => theme.background.secondary};
        box-shadow: 0 0 #0000;
    }
`

const SideItem = styled.div<{ side: 'right' | 'left' }>`
    position: absolute;
    top: 0;
    bottom: 0;
    ${({ side }) => side}: 0;
    display: flex;
    align-items: center;
`
        // <div className="relative flex w-full py-2 text-center bg-theme-background-nav-secondary matrix:bg-transparent">

// const FarmNav
export default (({ left, right }) => {
    const router = useRouter();

    useEffect(() => {
        router.prefetch('/stakepooltoken');
        router.prefetch('/stakebpt');
    }, []);

    const handleRoute = (route: number) => {
        switch (route) {
            case POOLTOKEN:
                router.push({
                    pathname: '/stakepooltoken',
                });
                break;
            case BPT:
                router.push({
                    pathname: '/stakebpt',
                });
                break;
            default:
                // nada
                break;
        }
    };

    return (
        <StyledFarmNav>
            <SideItem side="left">{left}</SideItem>
            <NavLinks>
                <Item
                    onClick={(_e) => handleRoute(POOLTOKEN)}
                    className={classNames(router.pathname === '/stakepooltoken' ? 'selected' : '')}
                >
                    Stake Pool Tokens
                </Item>
                <Item
                    onClick={(_e) => handleRoute(BPT)}
                    className={classNames(router.pathname === '/stakebpt' ? 'selected' : '')}
                >
                    Stake BPT
                </Item>
            </NavLinks>
            <SideItem side="right">{right}</SideItem>
        </StyledFarmNav>
    );
}) as React.FC<{
    left?: JSX.Element;
    right?: JSX.Element;
}>;
