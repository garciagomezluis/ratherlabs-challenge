import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { IERC20, IUniswapV2Pair, IUniswapV2Router02, SSYPV1, SSYPV2 } from '../typechain-types';

export const sushiAddress = '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2';
export const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
export const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const alcxAddress = '0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF';

export const routerAddress = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F';
export const sushiFactoryAddress = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';
export const masterchefAddressV1 = '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd';
export const masterchefAddressV2 = '0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d';

export async function transferTokenFunds(
    token: IERC20,
    account: SignerWithAddress,
    destination: string,
) {
    const balance = await token.balanceOf(account.address);
    const tx = await token.connect(account).transfer(destination, balance);

    await tx.wait();

    return balance;
}

export async function swapETHForWETH(account: SignerWithAddress, amount: string) {
    const weth = await ethers.getContractAt(['function deposit() public payable'], wethAddress);
    const tx = await weth.connect(account).deposit({ value: ethers.utils.parseEther(amount) });

    return tx.wait();
}

export async function swapETHForTokens(
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
            [wethAddress, tokenAddress],
            account.address,
            ethers.BigNumber.from(deadline),
            { value: ethers.utils.parseEther(amount) },
        );

    return tx.wait();
}

export const printSushiStatus = async (lpt: IUniswapV2Pair, yp: SSYPV1 | SSYPV2) => {
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
    const sushi = await ethers.getContractAt('IERC20', sushiAddress);

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
