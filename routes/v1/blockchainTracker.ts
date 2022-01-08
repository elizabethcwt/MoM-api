import * as express from 'express';
import { Request, Response } from 'express';
import { ethers } from 'ethers';
import Market from '../../ethereum/Market.sol/Market.json';
import { MongoClient, ObjectId } from 'mongodb';

const uri =
    'mongodb+srv://MinistryOfMetaMask:eF28WeXha7n3Y8DV@cluster0.6i8am.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

export default class BlockchainTracker {
    marketContract: ethers.Contract;
    provider: ethers.providers.JsonRpcProvider;
    collection: any;

    constructor() {
        const rinkebyUrl =
            'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
        this.provider = new ethers.providers.JsonRpcProvider(rinkebyUrl);
        // Create Contracts
        const marketContractAddress =
            '0xF71Ee360D73ECBFD5AF80Be34d6cCA20cd70Cb3f';
        this.marketContract = new ethers.Contract(
            marketContractAddress,
            Market.abi,
            this.provider
        );
        client.connect((err) => {
            this.collection = client.db('MoM').collection('Food');
        });
    }

    parseDateTimeData(data: number[]): string[] {
        const parsedData: string[] = [];
        for (let number of data) {
            if (number < 10) {
                let tempNumber = '0' + number;
                parsedData.push(tempNumber);
                continue;
            }
            parsedData.push(number.toString());
        }
        return parsedData;
    }

    createDateString(dateObject: Date): string {
        const year = dateObject.getFullYear();
        const month = dateObject.getMonth() + 1;
        const date = dateObject.getDate();
        const dateData: number[] = [month, date];
        const parsedData = this.parseDateTimeData(dateData);
        const dateString = year + '-' + parsedData[0] + '-' + parsedData[1];
        return dateString;
    }

    createTimeString(dateObject: Date): string {
        const hour = dateObject.getHours();
        const min = dateObject.getMinutes();
        const sec = dateObject.getSeconds();
        const dateData: number[] = [hour, min, sec];
        const parsedData = this.parseDateTimeData(dateData);
        const timeString =
            parsedData[0] + ':' + parsedData[1] + ':' + parsedData[2];
        return timeString;
    }

    convertTimeFromUnix(UNIXTimestamp: any): string {
        let dateTime: string;
        const dateObject = new Date(UNIXTimestamp * 1000);
        const date = this.createDateString(dateObject);
        const time = this.createTimeString(dateObject);
        dateTime = date + 'T' + time;
        return dateTime;
    }

    async searchDatabase(searchItem: any) {
        const searchResult = await this.collection.find(searchItem);
        const array = await searchResult.toArray();
        console.log(array);
        return array;
    }

    async getFoodDetails(foodID: any) {
        const foodDetails = await this.searchDatabase({
            _id: new ObjectId(foodID),
        });
        if (!foodDetails) {
            throw new Error(`Task ${foodID} is not found!`);
        }
        return foodDetails[0];
    }

    async addFoodNames(logs: any[], userAddress: string) {
        const formattedLogs: any = [];
        logs.map(async (event) => {
            if (event.hasOwnProperty('args') && event.args) {
                const foodDetails = await this.getFoodDetails(
                    event.args.foodID
                );
                const userProfile = await this.searchDatabase({
                    userWalletAddress: userAddress,
                });
                const logData = {
                    sender: userProfile[0].userName,
                    foodName: foodDetails.foodName,
                    foodImageUrl: foodDetails.foodImageUrl,
                    restaurantName: foodDetails.restaurantName,
                    date: this.convertTimeFromUnix(event.args.date),
                    tokenID: event.args.tokenId,
                };
                formattedLogs.unshift(logData);
            }
        });
        return formattedLogs;
    }

    async formatAndAddNames(logs: any[], userAddress: string) {
        const formattedLogs: any = [];
        logs.map(async (event) => {
            if (event.hasOwnProperty('args') && event.args) {
                const foodDetails = await this.getFoodDetails(
                    event.args.foodID
                );
                const logData = {
                    sender: userAddress,
                    foodName: foodDetails.foodName,
                    foodImageUrl: foodDetails.foodImageUrl,
                    restaurantName: foodDetails.restaurantName,
                    date: this.convertTimeFromUnix(event.args.date),
                    tokenID: event.args.tokenId,
                };
                formattedLogs.unshift(logData);
            }
        });
        return formattedLogs;
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
                    const data = this.formatAndAddNames(logArray, userAddress);
                    console.log(`Total buy count: ${buyCount}`);
                    res.send({
                        count: buyCount,
                        data: data,
                        message: 'Success',
                    }).status(200);
                } catch (err: any) {
                    console.log(err.message);
                    res.send({
                        count: 0,
                        data: '',
                        message: err.message,
                    }).status(500);
                }
            }
        );

        router.get(
            '/receivedgifts/:walletAddress',
            async (req: Request, res: Response) => {
                try {
                    const userAddress = req.params.walletAddress;
                    // Create filter for event
                    const dataFilter =
                        this.marketContract.filters.EventGiftFood(userAddress);
                    const startBlock = 0;
                    const endBlock = await this.provider.getBlockNumber();
                    const logs = await this.marketContract.queryFilter(
                        dataFilter,
                        startBlock,
                        endBlock
                    );
                    const logArray = [...logs];
                    const receivedCount = logArray.length;

                    const data = this.addFoodNames(logArray, userAddress);
                    console.log(`Total gift count: ${receivedCount}`);
                    res.send({
                        count: receivedCount,
                        data: data,
                        message: 'Success',
                    }).status(200);
                } catch (err: any) {
                    console.log(err.message);
                    res.send({
                        count: 0,
                        data: '',
                        message: err.message,
                    }).status(500);
                }
            }
        );

        router.get(
            '/redeemedgifts/:walletAddress',
            async (req: Request, res: Response) => {
                try {
                    const userAddress = req.params.walletAddress;
                    // Create filter for event
                    const dataFilter =
                        this.marketContract.filters.EventRedeemFood(
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
                    const receivedCount = logArray.length;

                    const data = this.formatAndAddNames(logArray, userAddress);
                    console.log(`Total redeem count: ${receivedCount}`);
                    res.send({
                        count: receivedCount,
                        data: data,
                        message: 'Success',
                    }).status(200);
                } catch (err: any) {
                    console.log(err.message);
                    res.send({
                        count: 0,
                        data: '',
                        message: err.message,
                    }).status(500);
                }
            }
        );
    }
}
