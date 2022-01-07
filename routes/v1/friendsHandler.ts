import * as express from 'express';
import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import multer from 'multer';

const uri =
    'mongodb+srv://MinistryOfMetaMask:eF28WeXha7n3Y8DV@cluster0.6i8am.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

export type FriendObject = {
    friendUserName: string;
    friendWalletAddress: string;
    friendEmail: string;
};

export default class FriendsHandler {
    collection: any;

    constructor() {
        client.connect((err) => {
            this.collection = client.db('MoM').collection('Users');
        });
    }

    async searchByUserName(searchTerm: string) {
        const searchResult = await this.collection.find({
            userName: searchTerm,
        });
        return await searchResult.toArray();
    }

    async searchByEmail(searchTerm: string) {
        const searchResult = await this.collection.find({
            userEmail: searchTerm,
        });
        return await searchResult.toArray();
    }

    async searchByWalletAddress(searchTerm: string) {
        const searchResult = await this.collection.find({
            userWalletAddress: searchTerm,
        });
        return await searchResult.toArray();
    }

    async searchMultipleFields(searchTerm: string) {
        let result = await this.searchByUserName(searchTerm);
        if (result[0]) return result;
        result = await this.searchByEmail(searchTerm);
        if (result[0]) return result;
        result = await this.searchByWalletAddress(searchTerm);
        if (result[0]) return result;
        throw new Error('No User Found');
    }

    findElementWithUserName(userName: string, array: any[]) {
        for (let element of array) {
            if (userName === element.friendUserName) {
                return element;
            }
        }
    }

    removeOldRequest(userName: any, requestArray: any) {
        const tempArray = requestArray;
        for (let i = 0; i < requestArray.length; i++) {
            if (requestArray[i].friendUserName === userName) {
                tempArray.splice(i, 1);
                break;
            }
        }
        return tempArray;
        // const newArray = requestArray.filter((element: any) => {
        //     element.friendUserName != userName;
        // });
        // console.log('FILTER');
        // console.log(newArray);
        // return newArray;
    }

    public routes(router: express.Router): void {
        router.post(
            '/friendrequest',
            multer().none(),
            async (req: Request, res: Response) => {
                try {
                    // Use username for sender
                    const senderId = req.body.userId;
                    const senderProfile = await this.searchByUserName(senderId);
                    if (!senderProfile[0]) {
                        throw new Error('Cannot find user profile');
                    }
                    // Check all 3 fields
                    const receiverId = req.body.receiver;
                    const receiverProfile = await this.searchMultipleFields(
                        receiverId
                    );
                    // Check for duplicate request
                    if (receiverProfile[0].friends.pending.length > 0) {
                        for (let request of receiverProfile[0].friends
                            .pending) {
                            if (request.sender === senderProfile[0].userName) {
                                throw new Error(
                                    'Friend request already sent previously'
                                );
                            }
                        }
                    }
                    // Update to pending of receiver
                    const addFriendRequest: FriendObject = {
                        friendUserName: senderProfile[0].userName,
                        friendWalletAddress: senderProfile[0].userWalletAddress,
                        friendEmail: senderProfile[0].userEmail,
                    };
                    const newPendingList = receiverProfile[0].friends;
                    newPendingList.pending.push(addFriendRequest);
                    await this.collection.updateOne(
                        {
                            userName: receiverProfile[0].userName,
                            userWalletAddress:
                                receiverProfile[0].userWalletAddress,
                        },
                        {
                            $set: { friends: newPendingList },
                        }
                    );
                    // Update to sentRequests of initator of request
                    const sentFriendRequest: FriendObject = {
                        friendUserName: receiverProfile[0].userName,
                        friendWalletAddress:
                            receiverProfile[0].userWalletAddress,
                        friendEmail: receiverProfile[0].userEmail,
                    };
                    const newSentRequestList = senderProfile[0].friends;
                    newSentRequestList.sentRequests.push(sentFriendRequest);
                    await this.collection.updateOne(
                        {
                            userName: senderProfile[0].userName,
                            userWalletAddress:
                                senderProfile[0].userWalletAddress,
                        },
                        {
                            $set: { friends: newSentRequestList },
                        }
                    );
                    res.send({
                        isOk: true,
                        message: 'Friend request sent',
                    }).status(200);
                } catch (err: any) {
                    console.log(err.message);
                    res.send({
                        isOk: false,
                        message: `Request failed: ${err.message}`,
                    }).status(500);
                }
            }
        );

        router.post(
            '/friendrequest/response',
            multer().none(),
            async (req: Request, res: Response) => {
                try {
                    // Request sent from other person
                    const senderUserName = req.body.senderUserName;
                    // Receiver user profile - Guy accepting
                    const receiverUserName = req.body.receiverUserName;
                    let isAccepted = req.body.isAccepted;
                    if (typeof isAccepted != 'boolean') {
                        console.log('Not boolean type');
                        isAccepted = isAccepted == 'true' ? true : false;
                    }

                    const requestSender = await this.searchByUserName(
                        senderUserName
                    );
                    const requestReceiver = await this.searchByUserName(
                        receiverUserName
                    );

                    if (isAccepted) {
                        // Move friend request for receiver from pending to confirmed - For receiver
                        // Move friend request from sent request to confirmed - For initiator
                        const senderNewFriendsList = requestSender[0].friends;
                        // For senderNewFriendsList, remove from sentRequests, add into confirmed friends
                        let newFriend = this.findElementWithUserName(
                            requestReceiver[0].userName,
                            senderNewFriendsList.sentRequests
                        );
                        // Add into confirmed friends
                        senderNewFriendsList.confirmed.push(newFriend);
                        senderNewFriendsList.sentRequests =
                            this.removeOldRequest(
                                newFriend.friendUserName,
                                senderNewFriendsList.sentRequests
                            );
                        await this.collection.updateOne(
                            {
                                userName: requestSender[0].userName,
                            },
                            {
                                $set: { friends: senderNewFriendsList },
                            }
                        );

                        const receiverNewFriendsList =
                            requestReceiver[0].friends;
                        // For receiverNewFriendsList, remove from pending, add into confirmed friends
                        newFriend = this.findElementWithUserName(
                            requestSender[0].userName,
                            receiverNewFriendsList.pending
                        );
                        // Add into confirmed friends
                        receiverNewFriendsList.confirmed.push(newFriend);
                        receiverNewFriendsList.pending = this.removeOldRequest(
                            newFriend.friendUserName,
                            receiverNewFriendsList.pending
                        );
                        await this.collection.updateOne(
                            {
                                userName: requestReceiver[0].userName,
                            },
                            {
                                $set: { friends: receiverNewFriendsList },
                            }
                        );
                    } else if (isAccepted === false) {
                        console.log(`REJECTED REQUEST`);
                        // Remove requests from both
                        const senderNewFriendsList = requestSender[0].friends;
                        senderNewFriendsList.sentRequests =
                            this.removeOldRequest(
                                requestReceiver[0].userName,
                                senderNewFriendsList.sentRequests
                            );
                        await this.collection.updateOne(
                            {
                                userName: requestSender[0].userName,
                            },
                            {
                                $set: { friends: senderNewFriendsList },
                            }
                        );
                        console.log(senderNewFriendsList);

                        const receiverNewFriendsList =
                            requestReceiver[0].friends;
                        receiverNewFriendsList.pending = this.removeOldRequest(
                            requestSender[0].userName,
                            receiverNewFriendsList.pending
                        );
                        console.log(receiverNewFriendsList);
                        await this.collection.updateOne(
                            {
                                userName: requestReceiver[0].userName,
                            },
                            {
                                $set: { friends: receiverNewFriendsList },
                            }
                        );
                        console.log('Successfully removed requests');
                    }

                    res.send({
                        isOk: true,
                        message: 'Updated friend status',
                    }).status(200);
                } catch (err: any) {
                    console.log(err.message);
                    res.send({
                        isOk: false,
                        message: `Request failed: ${err.message}`,
                    }).status(500);
                }
            }
        );
    }
}
