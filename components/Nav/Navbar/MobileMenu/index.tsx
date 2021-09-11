import React, { useState } from 'react';
import Hamburger from './Hamburger';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { classNames } from '@libs/utils/functions';
import NetworkDropdown from '../NetworkDropdown';
import AccountDropdown from '../AccountDropdown';

import Invest from '@public/img/general/invest.svg';
import Stake from '@public/img/general/stake.svg';
import Icon from '@ant-design/icons';
import { useRouter } from 'next/router';

export default (({ account, className }) => {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleRoute = (route: string) => {
        router.push({
            pathname: route,
        });
        setOpen(false);
    };

    return (
        <div className={classNames(`relative m-auto mr-0 overflow-hidden lg:hidden`, className ?? '')}>
            <Hamburger open={open} setOpen={setOpen} />
            <Transition.Root show={open} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 overflow-hidden top-full"
                    onClose={() => {
                        // do nothing here since its fired before the hamburger
                        console.debug('Closing mobile nav');
                    }}
                >
                    <div className="absolute inset-0 overflow-hidden">
                        <Dialog.Overlay className="absolute inset-0" />

                        <div className="fixed flex bottom-0 top-[60px] right-0 max-w-full lg:hidden">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <div className="w-screen md">
                                    <div className="h-full flex flex-col p-6 bg-tracer-900 overflow-y-scroll">
                                        <AccountDropdown account={account} className="my-4" />
                                        <NetworkDropdown className="w-full my-4 relative text-center" />
                                        <div className="text-white mt-2" onClick={() => handleRoute('/')}>
                                            <Icon className="text-xl mr-2 align-bottom" component={Invest} />
                                            Invest
                                        </div>
                                        <div className="text-white mt-2" onClick={() => handleRoute('stake')}>
                                            <Icon className="text-xl mr-2 align-bottom" component={Stake} />
                                            Stake
                                        </div>
                                    </div>
                                </div>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}) as React.FC<{
    account: string;
    className?: string;
}>;