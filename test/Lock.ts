import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('Lock', () => {
    async function deployFixture() {
        const [owner] = await ethers.getSigners();

        const Lock = await ethers.getContractFactory('Lock');
        const lock = await Lock.deploy();

        return { lock, owner };
    }

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            const { lock, owner } = await loadFixture(deployFixture);

            expect(await lock.owner()).to.equal(owner.address);
        });
    });
});
