import express from "express";
import {protectUser} from "../../middlewares/auth";
import {UserAuthenticatedReq} from "../../interfaces/AuthenticatedRequest";
import {createPayDue, getPayDuesByGroupId, getPayDuesByUserId} from "../../services/client/payDuesDbServices";
import {body, validationResult} from "express-validator";

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

router.post
("/create", protectUser,
    body('debtorId').isNumeric(),
    body('amount').isString(),
    body('currency').isString(),
    body('cardId').isString(),
    body('groupId').isNumeric(),
    body('description').isString(),
    async (req: UserAuthenticatedReq, res) => {

    const error = validationResult(req);
    if (!error.isEmpty())
        return res.status(400).json({ error: error.array() });

    const data = {
        creditorId: req.user.id,
        debtorId: Number(req.body.debtorId),
        groupId: Number(req.body.groupId),
        amount: req.body.amount,
        currency: req.body.currency,
        cardId: req.body.cardId,
        description: req.body.description
    }

    if (isNaN(data.debtorId) || isNaN(data.groupId))
        return res.status(400).json({
            success: false,
            message: "Invalid debtor or group ID",
        });

    const result = await createPayDue(data.debtorId, data.creditorId, data.amount, data.currency, data.cardId, data.groupId, data.description);
    if (!result.success)
        return res.status(400).json(result);

    return res.json(result);
});

export default router;