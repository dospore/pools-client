import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

export function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
}

export const BNFromString = (str: string, decimals: number): BigNumber => {
    return new BigNumber(ethers.utils.formatUnits(str, decimals));
};

export const escapeRegExp = (text: string): string => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

export const randomIntInRange = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
