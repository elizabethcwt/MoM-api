/**
 * List all components here e.g. Task, Tasks etc.
 */
const components = () => {
    return {
        schemas: {
            HealthStatus: {
                type: 'object',
                properties: {
                    message: 'string',
                    error: 'string',
                },
            }
            // add more types here
        },
    }
}

export default components
