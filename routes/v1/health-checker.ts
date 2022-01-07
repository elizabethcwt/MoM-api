import * as express from 'express';
import { Request, Response } from 'express';
import config from 'config';

export default class HealthChecker {
    public routes(router: express.Router): void {
        // web server health
        router.get('/health', async (req: Request, res: Response) => {
            // Redirect /health route to /ready route
            res.redirect(`/${config.get('version')}/ready`);
        });

        // database connection
        router.get('/ready', (req: Request, res: Response) => {
            return res.status(200).send('Server ok');
        });

    }
}
