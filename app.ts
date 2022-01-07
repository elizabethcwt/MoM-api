import ExpressConfiguration from './config/express.config';

const port = process.env.PORT || 5000;
const appConfig = new ExpressConfiguration();

const server = appConfig.app.listen(port, () =>
    console.log(`${appConfig.get('name')} listening on port ${port}...`)
);

export default server;
