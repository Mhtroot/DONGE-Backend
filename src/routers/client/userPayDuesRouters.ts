import express from "express";
import {protectUser} from "../../middlewares/auth";
import {UserAuthenticatedReq} from "../../interfaces/AuthenticatedRequest";
import {getPayDuesByGroupId, getPayDuesByUserId} from "../../services/client/payDuesDbServices";

const router = express.Router();

/*TODO
* get by group id -> user should be in the group
* get all of them by userid
* create a payment
* update the isPaid status
* edit the card, amount, almost everything
* delete the record
* */

router.get('/', protectUser, async (req: UserAuthenticatedReq, res) =>{
   const userId = req.user.id;

   const result = await getPayDuesByUserId(userId);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

router.get('/:groupId', protectUser, async (req: UserAuthenticatedReq, res) =>{
   const groupId = Number(req.params.groupId);
   if (isNaN(groupId))
       return res.status(403).json({
           success: false,
           message: "Invalid group ID",
       });

   const result = await getPayDuesByGroupId(groupId, req.user.id);
   if (!result)
       return res.status(400).json(result);

   return res.json(result);
});

export default router;