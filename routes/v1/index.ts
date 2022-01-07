// Logic
import * as express from 'express';

let router = express.Router();

// Controller/Routes Managers.
import HealthChecker from './health-checker';
import UserActions from './userActions';
import BlockchainTracker from './blockchainTracker';
import Food from './food';
import Restaurant from './restaurant';
import FriendsHandler from './friendsHandler';

// Creating new Routes Instances.
const healthRoute: HealthChecker = new HealthChecker();
const userActionsRoute: UserActions = new UserActions();
const blockchainTrackerRoute: BlockchainTracker = new BlockchainTracker();
const foodRoute: Food = new Food();
const restaurantRoute: Restaurant = new Restaurant();
const friendsHandlerRoute: FriendsHandler = new FriendsHandler();

// Registering our Routes.
healthRoute.routes(router);
userActionsRoute.routes(router);
blockchainTrackerRoute.routes(router);
foodRoute.routes(router);
restaurantRoute.routes(router);
friendsHandlerRoute.routes(router);

export default router;
