import express from "express";
import {protectUser} from "../../middlewares/auth";
import {body, validationResult} from "express-validator";
import {UserAuthenticatedReq} from "../../interfaces/AuthenticatedRequest";
import {createCard} from "../../services/client/userDbServices";

const router = express.Router();

router.post("/create", protectUser, body('cardPan').isString(), async (req: UserAuthenticatedReq, res) => {
   const error = validationResult(req);
   if (!error.isEmpty())
       return res.status(400).json({ error: error.array() });

   const pan = Number(req.body.cardPan)
    if (isNaN(pan) || (req.body.cardPan as string).length !== 16)
        return res.status(400).json({
            success: false,
            message: "لطفا شماره کارتت رو درست وارد کن 🤐❌",
        });

   const data = {
       userId: req.user.id,
       cardPan: pan.toString(),
   }

   const result = await createCard(data.cardPan, data.userId);

   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

export default router;