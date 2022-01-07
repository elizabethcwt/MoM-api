export default () => {
    return {
        summary: 'Returns overall health status',
        description: 'Returns health and ready status',
        responses: {
            200: {
                description: 'Returns health and ready status',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/HealthStatus',
                        },
                    },
                },
            },
        },
    }
}
