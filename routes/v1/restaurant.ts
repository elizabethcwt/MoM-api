import * as express from 'express';
import { Request, Response } from 'express';
import { MongoClient, ObjectId} from 'mongodb';
import multer from 'multer';
// import ObjectId from 'mongodb';

const uri =
    'mongodb+srv://MinistryOfMetaMask:eF28WeXha7n3Y8DV@cluster0.6i8am.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

export default class Restaurant {
    collection: any;

    constructor() {
        client.connect((err) => {
            this.collection = client.db('MoM').collection('Restaurants');
        });
    }

    async searchDatabase(searchItem: any) {
        const searchResult = await this.collection.find(searchItem);
        const array = await searchResult.toArray();
        console.log(array);
        return array;
    }

    async getDatabase() {
        const searchResult = await this.collection.find();
        const array = await searchResult.toArray();
        return array;
    }

    public routes(router: express.Router): void {
        // POST create
        router.post(
            '/restaurants',
            multer().none(),
            async (req: Request, res: Response) => {
                try {
                    // Set data into database
                    const restaurantData = {
                        restaurantName: req.body.foodName,
                        restaurantDescription: req.body.foodDescription,
                        restaurantImageUrl: req.body.restaurantImageUrl,
                    };
                    console.log('here')
                    this.collection.insertOne(restaurantData);
                    res.send({
                        isOk: true,
                        message: 'Restaurant listed',
                    }).status(200);
                    return;
                } catch (err: any) {
                    console.log(err.message);
                    res.send({
                        isOk: false,
                        message: err.message,
                    }).status(500);
                }
            }
        );

        router.get(
            '/restaurants',
            multer().none(),
            async (req: Request, res: Response) => {
                try {
                    // Retrieve details from database
                    console.log('restaurants')
                    const restaurantDetails = await this.getDatabase();
                    console.log(restaurantDetails)
                    res.send(restaurantDetails);
                } catch (err: any) {
                    res.send({
                        message: err.message,
                    }).status(403);
                }
            }
        );

    }
}
