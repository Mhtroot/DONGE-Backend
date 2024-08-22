import express from "express";
import {protectUser} from "../../middlewares/auth";
import {UserAuthenticatedReq} from "../../interfaces/AuthenticatedRequest";
import {userGetAllRequests} from "../../services/client/groupDbServices";

const router = express.Router();

router.get('/', protectUser, async (req:UserAuthenticatedReq, res) => {
   const userId = req.user.id;

   const result = await userGetAllRequests(userId);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

export default router;