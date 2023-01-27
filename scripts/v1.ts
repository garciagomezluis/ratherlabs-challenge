// npx hardhat run scripts/fun.ts --network hardhat
//
// This file is to check that everything works properly. This is not a proper test file.
// This file must be run over an Ethereum fork with at most the block 16467465
// The pair USDC-WETH was selected to show the concept.
// Any changes over the pair or the network fork could require a change over the price negotiation parameters in the subscribe function.
//

import { ethers } from 'hardhat';
import { mine } from '@nomicfoundation/hardhat-network-helpers';
import {
    masterchefAddressV1 as masterchefAddress,
    printSushiStatus,
    routerAddress,
    sushiFactoryAddress,
    swapETHForTokens,
    swapETHForWETH,
    transferTokenFunds,
    usdcAddress,
    wethAddress,
} from './utils';

async function main() {
    const [, , , , , , , , , , , , , , , , , , , account] = await ethers.getSigners();

    const YP = await ethers.getContractFactory('SSYPV1');

    console.log('... deploying YP ...');
    const yp = await YP.connect(account).deploy(routerAddress, masterchefAddress);

    const router = await ethers.getContractAt('IUniswapV2Router02', routerAddress);
    const weth = await ethers.getContractAt('IERC20', wethAddress);
    const usdc = await ethers.getContractAt('IERC20', usdcAddress);
    const sushiFactory = await ethers.getContractAt('IUniswapV2Factory', sushiFactoryAddress);
    const addressLPT = await sushiFactory.getPair(wethAddress, usdcAddress);
    const lpt = await ethers.getContractAt('IUniswapV2Pair', addressLPT);

    console.log(`... swaping ETH -> WETH ...`);
    await swapETHForWETH(account, '1000');

    console.log(`... swaping ETH -> USDC ...`);
    await swapETHForTokens(router, account, usdcAddress, '3');

    console.log(`... transfering WETH funds account -> YP ...`);
    await transferTokenFunds(weth, account, yp.address);

    console.log(`... transfering USDC funds account -> YP ...`);
    await transferTokenFunds(usdc, account, yp.address);

    await printSushiStatus(lpt, yp);

    try {
        console.log('... subscribing ...');

        const tx = await yp
            .connect(account)
            .subscribe(
                wethAddress,
                usdcAddress,
                5n * 10n ** 17n,
                822n * 10n ** 6n,
                49n * 10n ** 16n,
                810n * 10n ** 6n,
            );

        await tx.wait();

        await printSushiStatus(lpt, yp);

        await mine(1000);

        console.log('... unsubscribing ...');
        const tx1 = await yp.connect(account).unsubscribe(addressLPT);

        await tx1.wait();
        await printSushiStatus(lpt, yp);
    } catch (error) {
        console.log('check params', error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
