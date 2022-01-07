import config from 'config';
import info from './info';
import getHealth from './getHealth';
import components from './components';

export default () => {
    return {
        openapi: '3.0.0',
        info: info(),
        // servers: servers(),
        paths: {
            [`/${config.get('version')}/health`]: {
                get: getHealth(),
            },
            [`/${config.get('version')}/ready`]: {
                get: getHealth(),
            },
        },
        components: components(),
    };
};
