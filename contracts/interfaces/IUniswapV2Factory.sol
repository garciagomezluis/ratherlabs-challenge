// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// https://github.com/sushiswap/sushiswap/blob/archieve/canary/contracts/uniswapv2/interfaces/IUniswapV2Factory.sol

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}
