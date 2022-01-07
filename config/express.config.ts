// Configuration
import config from 'config';
import { RedisOptions } from 'ioredis';
import Express from 'express';
import Cors from 'cors';
import Helmet from 'helmet';
import router from '../routes/v1';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/v1';

export default class ExpressConfiguration {
    public app: Express.Application;
    private debugger: any;
    public version: string;

    constructor() {
        this.version = `/${config.get('version')}`;
        this.app = Express();
        this.startup();
    }

    // get app configuration
    public get(field: string): string {
        return config.get(field);
    }

    // map Azure Redis connection string into RedisOptions type
    public static cacheConfig(): RedisOptions {
        const redisConnectionString =
            process.env.REDIS_CONNECTION_STRING || config.get('redis');
        let redisConfig: any = {};
        redisConnectionString?.split(',').forEach((param, index) => {
            if (index == 0) {
                // host address and port
                redisConfig['host'] = param.includes(':')
                    ? param.split(':')[0]
                    : param;
                redisConfig['port'] = param.includes(':')
                    ? param.split(':')[1]
                    : 6379;
            } else {
                // other possible redis options
                const subParams: string[] = param.split('=');
                if (subParams.length >= 2) {
                    redisConfig[subParams[0]] = subParams
                        .slice(1)
                        .join()
                        .replace(',', '=');
                }
            }
        });
        redisConfig['tls'] = 'ssl' in redisConfig ? redisConfig['ssl'] : false;
        redisConfig['connectTimeout'] = 10000;
        return { ...redisConfig };
    }

    private startup() {
        this.app.use(Cors());
        this.app.use(Express.json());
        this.app.use(Express.urlencoded({ extended: true }));
        this.app.use(Helmet());
        this.app.set('etag', 'strong');

        // set view engine for non-production environment
        if (process.env.NODE_ENV != 'release') {
            // enable external JS scripts to load
            this.app.use((req, res, next) => {
                res.setHeader(
                    'content-security-policy',
                    "script-src 'self' https://* 'unsafe-inline' 'unsafe-eval';"
                );
                next();
            });

            this.app.use(Express.static('public'));
        }

        this.app.get('/', (req, res) => {
            // redirect to swagger
            res.redirect(`${this.version}-docs`);
        });

        const options = {
            swaggerOptions: {
                validatorUrl: null,
            },
        };

        this.app.use(this.version, router);
        this.app.use(
            `${this.version}-docs`,
            swaggerUi.serve,
            swaggerUi.setup(swaggerDocument(), options)
        );
    }
}
