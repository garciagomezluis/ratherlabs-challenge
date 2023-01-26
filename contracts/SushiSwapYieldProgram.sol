// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MasterChefManager.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Router02.sol";

// 1. mismo contrato puede handlear las dos versiones
// pro: más fácil, única dirección
// contra: no es facilmente extensible: subir una version más de masterchef implicaria cambiar el codigo y deployar de nuevo, teniendo dos versiones de SushiSwapYieldProgram; los balances quedarian mezclados

// 2. un contrato por cada version de masterchef
// pro: la liquidez queda asociada a la version de masterchef y no quedan mezclados los balances
// contra: varias formas de hacer; necesariamente arrancariamos con varias direcciones (una para cada version)

abstract contract SushiSwapYieldProgram is Ownable, MasterChefManager {
    IUniswapV2Router02 internal router;

    event Subscribed(uint256 indexed amountA, uint256 indexed amountB, address indexed lptokenAddress);

    constructor(IUniswapV2Router02 _router) {
        router = _router;
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

        bool allowed = depositAllowed(lptokenAddress);
        require(allowed, "pair: non existant on masterchef");

        // approve the sushiswap router to use your tokens
        approveTokens(tokenA, tokenB, amountADesired, amountBDesired);

        // provide liquidity on sushiswap by entering a pool using that is incentivezed by sushi
        (uint256 amountA, uint256 amountB, uint256 liquidity) = router.addLiquidity(
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
        lpt.approve(getAddress(), liquidity);

        // deposit the slp you received after supplying liquidity into a yield farm managed by masterchef contract, and earh sushi (safeTransferFrom, safeSushiTransfer?)
        deposit(lptokenAddress, liquidity);

        emit Subscribed(amountA, amountB, lptokenAddress);
    }

    function unsubscribe(address lptokenAddress) external onlyOwner notZeroAddress(lptokenAddress) {
        withdraw(lptokenAddress);
    }

    function approveTokens(address tokenA, address tokenB, uint256 amountA, uint256 amountB) private {
        IERC20 tA = IERC20(tokenA);
        IERC20 tB = IERC20(tokenB);

        tA.approve(address(router), amountA);
        tB.approve(address(router), amountB);
    }

    function getLPTokenAddres(address tokenA, address tokenB) private view returns(address lptokenAddress) {
        address factory = router.factory();
        lptokenAddress = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
    }
}
