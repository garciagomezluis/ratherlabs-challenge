// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

abstract contract MasterChefManager {
    mapping(address => uint256) public poolToLiquidity;

    modifier notZeroAddress(address addr) {
        require(addr != address(0), "address: not valid");
        _;
    }

    function getAddress() public view virtual returns(address);
    function depositAllowed(address lptokenAddress) internal view virtual returns(bool);
    function deposit(address lptokenAddress, uint256 amount) internal virtual;
    function withdraw(address lptokenAddress) internal virtual;
}
