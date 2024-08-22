import express from 'express';
import cors from "cors";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import session from "express-session";
import userAuthRouters from "./routers/client/userAuthRouters";
import userCardsRouters from "./routers/client/userCardsRouters";
import userGroupRouters from "./routers/client/userGroupRouters";
import userGroupRequestsRouters from "./routers/client/userGroupRequestsRouters";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Use express-session middleware
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}));


app.use("/user", userAuthRouters);
app.use("/user/card", userCardsRouters);
app.use("/group", userGroupRouters);
app.use("/group/request", userGroupRequestsRouters);

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger-output.json'), 'utf-8'));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", async (req, res) => {
    res.send("Hello World");
});

//09010140447: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzI0MzQ0ODIzLCJleHAiOjE3MjQ1MTc2MjN9.WHVgwlxlWJVZ3dDoXbt7XNKWUf2wpTDD6JAR1ufjWsU
//09020140447: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzI0MzQ4MzUzLCJleHAiOjE3MjQ1MjExNTN9.eRzkBr99purEiEu3Ulf0PTWJoO1bwJyct9bPtDkPoXY
export default app;