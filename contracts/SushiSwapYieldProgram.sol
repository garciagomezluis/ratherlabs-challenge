// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMasterChef.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract SushiSwapYieldProgram is Ownable {

    IUniswapV2Router02 private router;
    IMasterChef private masterChef;
    mapping(uint256 => uint256) public pidToLiquidity;

    event Subscribed(uint256 indexed pid, uint256 indexed liquidity);

    constructor(address routerAddress, address masterChefAddress) {
        router = IUniswapV2Router02(routerAddress);
        masterChef = IMasterChef(masterChefAddress);
    }

    function subscribe(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external onlyOwner {
        // check for correct amounts
        require(amountAMin < amountADesired && amountBMin < amountBDesired, "amount: not set properly");

        // check for only allowed pair
        address lptokenAddress = getLPTokenAddres(tokenA, tokenB);
        require(lptokenAddress != address(0x0), "pair: non existant");

        (bool valid, uint256 pid) = getPoolIndex(lptokenAddress);
        require(valid, "pair: non existant on masterchef");

        // approve the sushiswap router to use your tokens
        approveTokens(tokenA, tokenB, amountADesired, amountBDesired);

        // provide liquidity on sushiswap by entering a pool using that is incentivezed by sushi
        (, , uint256 liquidity) = router.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            address(this),
            block.timestamp + 5 minutes
        );

        // approve masterchef smart contract to use your tokens (LPtokens)
        IERC20 lpt = IERC20(lptokenAddress);
        lpt.approve(address(masterChef), liquidity);

        // deposit the slp you received after supplying liquidity into a yield farm managed by masterchef contract, and earh sushi (safeTransferFrom, safeSushiTransfer?)
        pidToLiquidity[pid] += liquidity;
        masterChef.deposit(pid, liquidity);

        emit Subscribed(pid, liquidity);
    }

    function unsubscribe(uint256 pid) external onlyOwner {
        uint256 liquidity = pidToLiquidity[pid];
        pidToLiquidity[pid] = 0;

        masterChef.withdraw(pid, liquidity);
    }

    function approveTokens(address tokenA, address tokenB, uint256 amountA, uint256 amountB) private {
        IERC20 tA = IERC20(tokenA);
        IERC20 tB = IERC20(tokenB);

        tA.approve(address(router), amountA);
        tB.approve(address(router), amountB);
    }

    function getPoolIndex(address lptokenAddress) private view returns(bool valid, uint256 pid) {
        uint256 poolLength = masterChef.poolLength();
        pid = 0;

        for(pid; pid < poolLength; pid++) {
            IMasterChef.PoolInfo memory poolInfo = masterChef.poolInfo(pid);
            if(address(poolInfo.lpToken) == lptokenAddress) break;
        }

        valid = pid < poolLength;
    }

    function getLPTokenAddres(address tokenA, address tokenB) private view returns(address lptokenAddress) {
        address factory = router.factory();
        lptokenAddress = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
    }
}
