import express from "express";
import {protectUser} from "../../middlewares/auth";
import {body} from "express-validator";
import {UserAuthenticatedReq} from "../../interfaces/AuthenticatedRequest";

const router = express.Router();

router.post("/create", protectUser, body('name').isString(), async (req:UserAuthenticatedReq, res) => {

});

export default router;