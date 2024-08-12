import swaggerAutogen from "swagger-autogen";
import dotenv from "dotenv";

dotenv.config();

const doc = {
    info: {
        title: "DONGE-API",
        description: "test the routes",
    },
    host: (process.env.BASE_URL as string).split('//')[1],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            scheme: 'bearer',
            in: 'header',
            name: 'Authorization',
            bearerFormat: 'JWT',
        },
    },
};

const outputFile = './swagger-output.json';
const routes = ['./server.ts'];

swaggerAutogen(outputFile, routes, doc);