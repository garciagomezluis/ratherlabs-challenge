// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./SushiSwapYieldProgram.sol";
import "./interfaces/IMasterChefV2.sol";
import "./interfaces/IUniswapV2Router02.sol";

import "hardhat/console.sol";

contract SSYPV2 is SushiSwapYieldProgram {
    mapping(address => uint256) public poolToPID;
    IMasterChefV2 internal masterChef;

    constructor(IUniswapV2Router02 _router, IMasterChefV2 _masterChef) SushiSwapYieldProgram(_router) {
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
        masterChef.deposit(pid, amount, address(this));
    }

    function withdraw(address lptokenAddress) internal override onlyOwner notZeroAddress(lptokenAddress) {
        (bool valid, uint256 pid) = getPoolIndex(lptokenAddress);
        require(valid, "pair: non existant on masterchef");

        uint256 liquidity = poolToLiquidity[lptokenAddress];
        poolToLiquidity[lptokenAddress] = 0;

        masterChef.withdrawAndHarvest(pid, liquidity, address(this));
    }

    function getPoolIndex(address lptokenAddress) private view returns(bool valid, uint256 pid) {
        uint256 poolLength = masterChef.poolLength();
        pid = 0;

        for(pid; pid < poolLength; pid++) {
            if(address(masterChef.lpToken(pid)) == lptokenAddress) break;
        }

        valid = pid < poolLength;
    }
}
