import { ethers } from 'hardhat';
import { masterchefAddressV1, routerAddress } from './utils';

async function main() {
    const YP = await ethers.getContractFactory('SSYPV1');
    const yp = await YP.deploy(routerAddress, masterchefAddressV1);

    console.log('Deployed: ', yp.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
