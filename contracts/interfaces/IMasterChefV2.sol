// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// https://github.com/sushiswap/sushiswap/blob/archieve/canary/contracts/interfaces/IMasterChef.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMasterChefV2 {
    function lpToken(uint256 _pid) external view returns (IERC20);
    function deposit(uint256 _pid, uint256 _amount, address _to) external;
    function withdrawAndHarvest(uint256 _pid, uint256 _amount, address _to) external;
    function poolLength() external view returns (uint256);
}
