// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// https://github.com/sushiswap/sushiswap/blob/archieve/canary/contracts/uniswapv2/interfaces/IUniswapV2Router01.sol

interface IUniswapV2Router01 {
    function factory() external pure returns (address);
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}
