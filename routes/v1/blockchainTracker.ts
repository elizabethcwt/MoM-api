import * as express from 'express';
import { Request, Response } from 'express';
import { ethers } from 'ethers';
import Market from '../../ethereum/Market.sol/Market.json';

export default class BlockchainTracker {
    marketContract: ethers.Contract;
    provider: ethers.providers.JsonRpcProvider;

    constructor() {
        const rinkebyUrl =
            'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
        this.provider = new ethers.providers.JsonRpcProvider(rinkebyUrl);
        // Create Contracts
        const marketContractAddress =
            '0x6153d03fA3F11AFDd6c28Bc83608CEAE5Bf0E973';
        this.marketContract = new ethers.Contract(
            marketContractAddress,
            Market.abi,
            this.provider
        );
    }

    public routes(router: express.Router): void {
        // Gets buy progress count
        router.get(
            '/buyprogress/:walletAddress',
            async (req: Request, res: Response) => {
                try {
                    const userAddress = req.params.walletAddress;
                    // Create filter for event
                    const dataFilter =
                        this.marketContract.filters.EventBoughtFood(
                            userAddress
                        );
                    const startBlock = 0;
                    const endBlock = await this.provider.getBlockNumber();
                    const logs = await this.marketContract.queryFilter(
                        dataFilter,
                        startBlock,
                        endBlock
                    );
                    const logArray = [...logs];
                    const buyCount = logArray.length;
                    console.log(`Total buy count: ${buyCount}`);
                    res.send({ count: buyCount, message: 'Success' }).status(
                        200
                    );
                } catch (err: any) {
                    console.log(err.message);
                    res.send({ count: 0, message: err.message }).status(500);
                }
            }
        );
    }
}
