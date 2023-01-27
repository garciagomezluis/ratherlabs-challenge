import { ethers } from 'hardhat';
import { masterchefAddressV2, routerAddress } from './utils';

async function main() {
    const YP = await ethers.getContractFactory('SSYPV2');
    const yp = await YP.deploy(routerAddress, masterchefAddressV2);

    console.log('Deployed: ', yp.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
