// npx hardhat run scripts/fun.ts --network hardhat
//
// This file is to check that everything works properly. This is not a proper test file.
// This file must be run over an Ethereum fork with at most the block 16467465
// The pair USDC-WETH was selected to show the concept.
// Any changes over the pair or the network fork could require a change over the price negotiation parameters in the subscribe function.
//

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { IERC20, IUniswapV2Pair, IUniswapV2Router02, SSYPV1, SSYPV2 } from '../typechain-types';

const addressSUSHI = '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2';
const addressWETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const addressUSDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
// const addressALCX = '0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF';

const addressRouter = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
const addressSushiFactory = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';

const addressMasterChefV1 = '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd';
const token0Address = addressWETH;
const token1Address = addressUSDC;

const printSushiStatus = async (lpt: IUniswapV2Pair, yp: SSYPV1 | SSYPV2) => {
    // non standard, just for testing
    const tokenABI = [
        'function balanceOf(address account) external view returns (uint256)',
        'function symbol() public view returns (string memory)',
        'function decimals() public view returns (uint8)',
    ];

    const token0Address = await lpt.token0();
    const token0 = await ethers.getContractAt(tokenABI, token0Address);
    const token0Symbol = await token0.symbol();
    const token0Decimals = Number(await token0.decimals());

    const token1Address = await lpt.token1();
    const token1 = await ethers.getContractAt(tokenABI, token1Address);
    const token1Symbol = await token1.symbol();
    const token1Decimals = Number(await token1.decimals());

    const [reserve0, reserve1] = await lpt.getReserves();
    const sushi = await ethers.getContractAt('IERC20', addressSUSHI);

    console.table({
        [`${token0Symbol}-${token1Symbol} LPT address`]: lpt.address,
        [`Pool ${token0Symbol} balance`]: ethers.utils.formatUnits(reserve0, token0Decimals),
        [`Pool ${token1Symbol} balance`]: ethers.utils.formatUnits(reserve1, token1Decimals),
        [`YP ${token0Symbol}-${token1Symbol} LPT balance`]: ethers.utils.formatUnits(
            await lpt.balanceOf(yp.address),
            18,
        ),
        [`YP ${token0Symbol} balance`]: ethers.utils.formatUnits(
            await token0.balanceOf(yp.address),
            token0Decimals,
        ),
        [`YP ${token1Symbol} balance`]: ethers.utils.formatUnits(
            await token1.balanceOf(yp.address),
            token1Decimals,
        ),
        'YP SUSHI balance': ethers.utils.formatUnits(await sushi.balanceOf(yp.address), 18),
    });
};

async function transferTokenFunds(token: IERC20, account: SignerWithAddress, destination: string) {
    const balance = await token.balanceOf(account.address);
    const tx = await token.connect(account).transfer(destination, balance);

    return tx.wait();
}

async function swapETHForWETH(account: SignerWithAddress, amount: string) {
    const weth = await ethers.getContractAt(['function deposit() public payable'], addressWETH);
    const tx = await weth.connect(account).deposit({ value: ethers.utils.parseEther(amount) });

    return tx.wait();
}

async function swapETHForTokens(
    router: IUniswapV2Router02,
    account: SignerWithAddress,
    tokenAddress: string,
    amount: string,
) {
    const deadline = Math.floor(new Date().getTime() / 1000 + 60); // ~60 seconds;

    const tx = await router
        .connect(account)
        .swapExactETHForTokens(
            ethers.BigNumber.from(0),
            [addressWETH, tokenAddress],
            account.address,
            ethers.BigNumber.from(deadline),
            { value: ethers.utils.parseEther(amount) },
        );

    return tx.wait();
}

async function main() {
    const [, , , , , , , , , , , , , , , , , , , account] = await ethers.getSigners();

    const YP = await ethers.getContractFactory('SSYPV1');

    console.log('... deploying YP ...');
    const yp = await YP.connect(account).deploy(addressRouter, addressMasterChefV1);

    const router = await ethers.getContractAt('IUniswapV2Router02', addressRouter);
    const token0 = await ethers.getContractAt('IERC20', token0Address);
    const token1 = await ethers.getContractAt('IERC20', token1Address);
    const sushiFactory = await ethers.getContractAt('IUniswapV2Factory', addressSushiFactory);
    const addressLPT = await sushiFactory.getPair(token0Address, token1Address);
    const lpt = await ethers.getContractAt('IUniswapV2Pair', addressLPT);

    console.log(`... swaping ETH -> TKN0 ...`);
    await swapETHForWETH(account, '1000');

    console.log(`... swaping ETH -> TKN1 ...`);
    await swapETHForTokens(router, account, token1Address, '3');

    console.log(`... transfering TKN0 funds account -> YP ...`);
    await transferTokenFunds(token0, account, yp.address);

    console.log(`... transfering TKN1 funds account -> YP ...`);
    await transferTokenFunds(token1, account, yp.address);

    await printSushiStatus(lpt, yp);

    try {
        console.log('... subscribing ...');

        const tx = await yp
            .connect(account)
            .subscribe(
                token0Address,
                token1Address,
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
