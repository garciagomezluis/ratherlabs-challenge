import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';

require('dotenv').config();

const config: HardhatUserConfig = {
    solidity: '0.8.17',
    networks: {
        mainnet: {
            url: `${process.env.ALCHEMY_URL}`,
            accounts: [process.env.MAINNET_PRIVATE_KEY!],
        },
        hardhat: {
            forking: {
                url: `${process.env.ALCHEMY_URL}`,
                blockNumber: 16467465,
            },
            chainId: 1,
        },
    },
};

export default config;
