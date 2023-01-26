// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// https://github.com/sushiswap/sushiswap/blob/archieve/canary/contracts/interfaces/IMasterChef.sol

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMasterChefV1 {
    struct PoolInfo {
        IERC20 lpToken;
    }

    function poolInfo(uint256 _pid) external view returns (PoolInfo memory);
    function deposit(uint256 _pid, uint256 _amount) external;
    function withdraw(uint256 _pid, uint256 _amount) external;
    function poolLength() external view returns (uint256);
}
