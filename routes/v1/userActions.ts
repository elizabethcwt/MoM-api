import { string } from '@hapi/joi';
import * as express from 'express';
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import { FriendObject } from './friendsHandler';

const uri =
    'mongodb+srv://MinistryOfMetaMask:eF28WeXha7n3Y8DV@cluster0.6i8am.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

type UserData = {
    userName: string;
    userPassword: string;
    userEmail: string;
    userWalletAddress: string;
    userDeliveryAddress: string;
    friends: {
        sentRequests: Array<FriendObject>;
        pending: Array<FriendObject>;
        confirmed: Array<FriendObject>;
    };
};

export default class UserActions {
    collection: any;

    constructor() {
        client.connect((err) => {
            this.collection = client.db('MoM').collection('Users');
        });
    }

    async searchDatabase(searchItem: any) {
        const searchResult = await this.collection.find(searchItem);
        const array = await searchResult.toArray();
        return array;
    }

    public routes(router: express.Router): void {
        // POST create
        router.post(
            '/signup',
            multer().none(),
            async (req: Request, res: Response) => {
                try {
                    // Set data into database
                    const userData: UserData = {
                        userName: req.body.userName,
                        userPassword: req.body.userPassword,
                        userEmail: req.body.userEmail,
                        userWalletAddress: req.body.userWalletAddress,
                        userDeliveryAddress: req.body.userDeliveryAddress,
                        friends: {
                            sentRequests: [],
                            pending: [],
                            confirmed: [],
                        },
                    };
                    // Check if userName (unique), wallet address have been used before
                    const usernameArray = await this.searchDatabase({
                        userName: req.body.username,
                    });
                    if (usernameArray.length > 0) {
                        throw new Error('Username already exists');
                    }
                    // Check email
                    const emailArray = await this.searchDatabase({
                        userEmail: req.body.email,
                    });
                    if (emailArray.length > 0) {
                        throw new Error('Email already exists');
                    }
                    // Check wallet address
                    const walletAddressArray = await this.searchDatabase({
                        userWalletAddress: req.body.walletAddress,
                    });
                    if (walletAddressArray.length > 0) {
                        throw new Error('Wallet address already exists');
                    }

                    // No repeats, proceed to insert
                    await this.collection.insertOne(userData);
                    res.send({
                        isOk: true,
                        userProfile: userData,
                        message: 'Sign up successful',
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

        router.post(
            '/signin',
            multer().none(),
            async (req: Request, res: Response) => {
                try {
                    const userId = req.body.userId;
                    const userPassword = req.body.userPassword;
                    // Retrieve details from database
                    let userDetails = await this.searchDatabase({
                        userName: userId,
                    });
                    // Check if user exists, if not use email
                    if (userDetails.length === 0) {
                        console.log('Cannot find username, searching email');
                        userDetails = await this.searchDatabase({
                            userEmail: userId,
                        });
                        if (userDetails.length === 0) {
                            throw new Error('User not found');
                        }
                    }
                    // Check if password is correct
                    if (userPassword === userDetails[0].userPassword) {
                        res.send({
                            loginOk: true,
                            userProfile: userDetails[0],
                            message: 'Login success',
                        }).status(200);
                    }
                    throw new Error('Login failed - Invalid Password');
                } catch (err: any) {
                    res.send({
                        loginOk: false,
                        userProfile: null,
                        message: err.message,
                    }).status(403);
                }
            }
        );
    }
}
