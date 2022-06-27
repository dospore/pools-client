import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SimpleBrowse } from '~/archetypes/SimplePools';
import Footer from '~/components/Footer';
import SEO from '~/components/General/SEO';
import UnsupportedNetworkPopup from '~/components/General/UnsupportedNetworkPopup';
import NavBar from '~/components/Nav/Navbar';
import OnboardTradeModal from '~/components/OnboardModal/Trade';
import { seoContent } from '~/constants/seo';
import { SwapStore } from '~/context/SwapContext';

export default (() => {
    const router = useRouter();
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [onboardStep, setOnboardStep] = useState<number>(1);

    useEffect(() => {
        router.prefetch('/');
    }, []);

    return (
        <div className={`page relative matrix:bg-matrix-bg`}>
            <SEO {...seoContent.pools} />
            <NavBar setShowOnboardModal={setShowOnboardModal} />
            <SwapStore>
                <SimpleBrowse />
            </SwapStore>
            <UnsupportedNetworkPopup />
            <OnboardTradeModal
                onboardStep={onboardStep}
                setOnboardStep={setOnboardStep}
                showOnboardModal={showOnboardModal}
                setShowOnboardModal={() => {
                    setShowOnboardModal(false);
                    setTimeout(() => {
                        setOnboardStep(1);
                    }, 1000);
                }}
            />
            <Footer />
        </div>
    );
}) as React.FC;
