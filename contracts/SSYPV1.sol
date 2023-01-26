// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./SushiSwapYieldProgram.sol";
import "./interfaces/IMasterChefV1.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract SSYPV1 is SushiSwapYieldProgram {
    mapping(address => uint256) public poolToPID;
    IMasterChefV1 internal masterChef;

    constructor(IUniswapV2Router02 _router, IMasterChefV1 _masterChef) SushiSwapYieldProgram(_router) {
        masterChef = _masterChef;
    }

    function getAddress() public view override returns(address) {
        return address(masterChef);
    }

    function depositAllowed(address lptokenAddress) internal view override notZeroAddress(lptokenAddress) returns(bool valid) {
        (valid,) = getPoolIndex(lptokenAddress);
    }

    function deposit(address lptokenAddress, uint256 amount) internal override onlyOwner notZeroAddress(lptokenAddress) {
        (bool valid, uint256 pid) = getPoolIndex(lptokenAddress);
        require(valid, "pair: non existant on masterchef");

        poolToLiquidity[lptokenAddress] += amount;
        masterChef.deposit(pid, amount);
    }

    function withdraw(address lptokenAddress) internal override onlyOwner notZeroAddress(lptokenAddress) {
        (bool valid, uint256 pid) = getPoolIndex(lptokenAddress);
        require(valid, "pair: non existant on masterchef");

        uint256 liquidity = poolToLiquidity[lptokenAddress];
        poolToLiquidity[lptokenAddress] = 0;

        masterChef.withdraw(pid, liquidity);
    }

    function getPoolIndex(address lptokenAddress) private view returns(bool valid, uint256 pid) {
        uint256 poolLength = masterChef.poolLength();
        pid = 0;

        for(pid; pid < poolLength; pid++) {
            IMasterChefV1.PoolInfo memory poolInfo = masterChef.poolInfo(pid);
            if(address(poolInfo.lpToken) == lptokenAddress) break;
        }

        valid = pid < poolLength;
    }
}
