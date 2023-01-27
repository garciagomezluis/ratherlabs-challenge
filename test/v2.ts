import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers';

import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
    alcxAddress,
    masterchefAddressV2 as masterchefAddress,
    routerAddress,
    sushiAddress,
    sushiFactoryAddress,
    swapETHForTokens,
    swapETHForWETH,
    transferTokenFunds,
    wethAddress,
} from '../scripts/utils';

describe('SSYPV2', () => {
    async function setupFixture() {
        const [, , , , , , , , , , , , , , , , , , other, account] = await ethers.getSigners();

        const YP = await ethers.getContractFactory('SSYPV2');
        const yp = await YP.connect(account).deploy(routerAddress, masterchefAddress);

        const router = await ethers.getContractAt('IUniswapV2Router02', routerAddress);
        const weth = await ethers.getContractAt('IERC20', wethAddress);
        const alcx = await ethers.getContractAt('IERC20', alcxAddress);
        const sushi = await ethers.getContractAt('IERC20', sushiAddress);
        const sushiFactory = await ethers.getContractAt('IUniswapV2Factory', sushiFactoryAddress);
        const addressLPT = await sushiFactory.getPair(wethAddress, alcxAddress);
        const lpt = await ethers.getContractAt('IUniswapV2Pair', addressLPT);

        await swapETHForWETH(account, '1000');
        await swapETHForTokens(router, account, alcxAddress, '3');

        const transferredWETHBalance = await transferTokenFunds(weth, account, yp.address);
        const transferredALCXBalance = await transferTokenFunds(alcx, account, yp.address);

        return {
            yp,
            owner: account,
            other,
            weth,
            alcx,
            sushi,
            lpt,
            transferredWETHBalance,
            transferredALCXBalance,
        };
    }

    describe('Setup yp for WETH-ALCX pair', () => {
        it('Should set the right owner', async () => {
            const { yp, owner } = await loadFixture(setupFixture);

            expect(await yp.owner()).to.equal(owner.address);
        });

        it('Should revert if called deposit with another user', async () => {
            const { yp, other } = await loadFixture(setupFixture);

            await expect(
                yp.connect(other).subscribe(yp.address, yp.address, 0, 0, 0, 0),
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('Should revert if called unsubscribe with a Zero Address for an LP token', async () => {
            const { yp, owner } = await loadFixture(setupFixture);

            await expect(
                yp.connect(owner).unsubscribe(ethers.constants.AddressZero),
            ).to.be.revertedWith('address: not valid');
        });

        it('Should have transferred WETH balance', async () => {
            const { yp, transferredWETHBalance } = await loadFixture(setupFixture);

            const weth = await ethers.getContractAt('IERC20', wethAddress);
            const balance = await weth.balanceOf(yp.address);

            expect(balance).to.equal(transferredWETHBalance);
        });

        it('Should have transferred ALCX balance', async () => {
            const { yp, transferredALCXBalance } = await loadFixture(setupFixture);

            const weth = await ethers.getContractAt('IERC20', alcxAddress);
            const balance = await weth.balanceOf(yp.address);

            expect(balance).to.equal(transferredALCXBalance);
        });

        it('Should have no LP tokens', async () => {
            const { yp, lpt } = await loadFixture(setupFixture);

            const balance = await lpt.balanceOf(yp.address);

            expect(balance).to.equal(ethers.BigNumber.from(0));
        });

        it('Should have no SUSHI tokens', async () => {
            const { yp, sushi } = await loadFixture(setupFixture);

            const balance = await sushi.balanceOf(yp.address);

            expect(balance).to.equal(ethers.BigNumber.from(0));
        });

        it('Should have configured the masterchef v2 contract', async () => {
            const { yp } = await loadFixture(setupFixture);

            expect(await yp.getAddress()).to.equal(masterchefAddress);
        });
    });

    describe('Subscription', () => {
        async function subscribeFixture() {
            const { yp, owner, ...others } = await loadFixture(setupFixture);

            const tx = await yp
                .connect(owner)
                .subscribe(
                    wethAddress,
                    alcxAddress,
                    5n * 10n ** 17n,
                    45n * 10n ** 18n,
                    49n * 10n ** 16n,
                    30n * 10n ** 18n,
                );

            await tx.wait();

            return { yp, owner, ...others };
        }

        it('Should have moved some WETH balance to Pool', async () => {
            const { yp, weth, lpt, transferredWETHBalance } = await loadFixture(subscribeFixture);

            const initialTokenBalanceInPool = await weth.balanceOf(lpt.address);
            const balance = await weth.balanceOf(yp.address);
            const finalTokenBalanceInPool = await weth.balanceOf(lpt.address);

            expect(finalTokenBalanceInPool.sub(initialTokenBalanceInPool)).to.lt(
                transferredWETHBalance.sub(balance),
            );
        });

        it('Should have moved some ALCX balance to Pool', async () => {
            const { yp, alcx, lpt, transferredALCXBalance } = await loadFixture(subscribeFixture);

            const initialTokenBalanceInPool = await alcx.balanceOf(lpt.address);
            const balance = await alcx.balanceOf(yp.address);
            const finalTokenBalanceInPool = await alcx.balanceOf(lpt.address);

            expect(finalTokenBalanceInPool.sub(initialTokenBalanceInPool)).to.lt(
                transferredALCXBalance.sub(balance),
            );
        });

        it('Should have no LP tokens', async () => {
            const { yp, lpt } = await loadFixture(subscribeFixture);

            const balance = await lpt.balanceOf(yp.address);

            expect(balance).to.eq(ethers.BigNumber.from(0));
        });

        it('Should have no SUSHI tokens', async () => {
            const { yp, sushi } = await loadFixture(setupFixture);

            const balance = await sushi.balanceOf(yp.address);

            expect(balance).to.eq(ethers.BigNumber.from(0));
        });

        describe('Unsubscription', () => {
            async function unsubscribeFixture() {
                const { yp, owner, lpt, ...others } = await loadFixture(subscribeFixture);

                await mine(1000);

                const tx = await yp.connect(owner).unsubscribe(lpt.address);

                await tx.wait();

                return { yp, owner, lpt, ...others };
            }

            it('Should have some LP tokens', async () => {
                const { yp, lpt } = await loadFixture(unsubscribeFixture);

                const balance = await lpt.balanceOf(yp.address);

                expect(balance).to.gt(ethers.BigNumber.from(0));
            });

            it('Should have some SUSHI tokens', async () => {
                const { yp, sushi } = await loadFixture(unsubscribeFixture);

                const balance = await sushi.balanceOf(yp.address);

                expect(balance).to.gt(ethers.BigNumber.from(0));
            });
        });
    });
});
