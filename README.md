# Ratherlabs challenge

## Context

[Complete version](./assets/challenge.pdf)

![task.jpeg](/assets/task.jpeg)
## Design and implementation

SushiSwap' contracts are deployed in multiple networks. Even though the requested feature would work in all of them, it was tested locally in a locally created Ethereum fork. Minor changes would be necessary for testing and deploying in other networks, such as updating SushiSwap' addresses and configuring the hardhat environment.

Two main models were had into account to implement the requested feature:

1. The same contract can handle both MasterChef versions. This would have some caveats as mixing balances for both of them and it will not be simple extending it in case of new MasterChef versions*. As a positive point: a unique contract would be deployed, so a unique address to handle.

2. Deploying a contract to deal with each version of MasterChef. The interface and core implementation would be the same for all of them. The balances would be targeted with a specific version of MasterChef: balances would not be mixed.

Option 2 was selected.

\* Probably thinking about an upgradable contract from the beginning could help.

__Contracts files__

| name  | description  |
|---|---|
| MasterChefManager.sol  | Abstract contract defining a basic interface that will allow us to use any version of MasterChef |
| SushiSwapYieldProgram.sol  | Abstract contract defining functions that will allow us to "subscribe" to MasterChef to start getting the SUSHI token  |
| SSYPV1.sol  | Implementation contract with interactions with MasterChef V1  |
| SSYPV2.sol  | Implementation contract with interactions with MasterChef V2  |

__Inheritance relation__

MasterChefManager <- SushiSwapYieldProgram <- SSYPV1.sol

MasterChefManager <- SushiSwapYieldProgram <- SSYPV2.sol

__Explanation__

The contracts that can be deployed are: SSYPV1.sol and SSYPV2.sol. Both of them have the same interface. From the user's point there is only one relevant function allowed for them to use:

```solidity
function subscribe(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external onlyOwner;
```

This function implements the challenge's requested feature. It can be found in [SushiSwapYieldProgram.sol](/contracts/SushiSwapYieldProgram.sol) and the arguments are used in the following way:

| name  | description  |
|---|---|
| tokenA | Address of the tokenA for the desired pool |
| tokenB | Address of the tokenB for the desired pool |
| amountADesired | Amount of tokenA you wish to contribute to the pool |
| amountBDesired | Amount of tokenB you wish to contribute to the pool |
| amountAMin | Amount of tokenA that you are willing to receive as min |
| amountBMin | Amount of tokenB that you are willing to receive as min |

All these arguments are used to find the pool you are interested in participating in and to find the proportion of the tokens that will be affected by the trade. These arguments are inherited from MasterChef' contracts.

## Development

__Installation__

Node > v16.13.2

```shell
npm i
cp .env.example .env
```

Then fill in the variables in the .env file with your data.

__Actions__

| description  | command  |
|---|---|
| Play with MasterChef V1 | npm run play:v1 |
| Play with MasterChef V2 | npm run play:v2 |
| Run tests | npm test |
| Deploy V1 | npx hardhat run scripts/deploy_v1.ts --network mainnet |
| Deploy V2 | npx hardhat run scripts/deploy_v2.ts --network mainnet |

## Considerations and things to be done or improved

All changes in the blockNumber attribute of Hardhat Ethereum Fork would require to update tests and 'play' scripts as that change could bring changes in assets prices of the tokens involved.

Depositing a LPTokens in any version of MasterChef does not guarantee SUSHI rewards as this depends on multiple variables and configuration of the contract owners. Yield strategy has to be selected carefully in order to get SUSHI and other tokens as a reward and this could change at any time. Tokens in test files were selected with this in mind.

An 'unsubscribe' function was introduced just to complete the whole process and get back the vested SUSHI tokens and the previously deposited LPTokens. This is just for testing purposes and to illustrate the whole cycle. In a real life contract a function of this type would be mandatory as well as a 'withdraw' function that allows the user to get their rewards.

As a pending improvement: MasterChef' contracts persist the main state in arrays. Getting the necessary index in this implementation is done in a linear search over that array: this could be inefficient and probably exists a better way to do it that I could not catch in the contracts screenings.

Besides deploying the contracts, it would be interesting to export the interfaces to facilitate the use of this feature in others .sol files
