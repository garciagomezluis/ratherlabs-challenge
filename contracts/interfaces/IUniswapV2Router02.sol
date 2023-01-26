// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./IUniswapV2Router01.sol";

// https://github.com/sushiswap/sushiswap/blob/archieve/canary/contracts/uniswapv2/interfaces/IUniswapV2Router02.sol

interface IUniswapV2Router02 is IUniswapV2Router01 {
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
}
