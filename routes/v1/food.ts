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

export default class Food {
    collection: any;

    constructor() {
        client.connect((err) => {
            this.collection = client.db('MoM').collection('Food');
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
        // console.log(array);
        return array;
    }

    public routes(router: express.Router): void {
        // POST create
        router.post(
            '/food',
            multer().none(),
            async (req: Request, res: Response) => {
                try {
                    // Set data into database
                    const foodData = {
                        foodName: req.body.foodName,
                        foodDescription: req.body.foodDescription,
                        foodPrice: req.body.foodPrice,
                        foodImageUrl: req.body.foodImageUrl,
                        restaurantName: req.body.restaurantName,
                    };
                    console.log('here')
                    this.collection.insertOne(foodData);
                    res.send({
                        isOk: true,
                        message: 'Food listed',
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
            '/food/:id',
            multer().none(),
            async (req: Request, res: Response) => {
                console.log('here')
                try {
                    const foodID = req.params.id;
                    // Retrieve details from database
                    const foodDetails = await this.searchDatabase({
                        _id: new ObjectId(foodID),
                    });
                    if (!foodDetails) {
                        throw new Error(`Task ${foodID} is not found!`);
                    }
                    res.send(foodDetails[0]);
                } catch (err: any) {
                    res.send({
                        message: err.message,
                    }).status(403);
                }
            }
        );

        router.get(
            '/restaurant/:name',
            multer().none(),
            async (req: Request, res: Response) => {
                console.log('here')
                try {
                    const name = req.params.name;
                    // Retrieve details from database
                    const restaurantMenu = await this.searchDatabase({
                        restaurantName: name,
                    });
                    if (!restaurantMenu) {
                        throw new Error(`Task ${restaurantMenu} is not found!`);
                    }
                    res.send(restaurantMenu);
                } catch (err: any) {
                    res.send({
                        message: err.message,
                    }).status(403);
                }
            }
        );


    }
}
