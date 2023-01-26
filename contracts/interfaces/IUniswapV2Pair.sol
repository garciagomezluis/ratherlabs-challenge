// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// https://github.com/sushiswap/sushiswap/blob/archieve/canary/contracts/uniswapv2/interfaces/IUniswapV2Pair.sol

interface IUniswapV2Pair {
    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    function balanceOf(address owner) external view returns (uint);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}
