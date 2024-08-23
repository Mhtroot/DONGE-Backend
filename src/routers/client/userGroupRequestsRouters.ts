import express from "express";
import {protectUser} from "../../middlewares/auth";
import {UserAuthenticatedReq} from "../../interfaces/AuthenticatedRequest";
import {
    createAddMemberRequest,
    getRequestById,
    updateGroupRequest,
    userGetAllRequests
} from "../../services/client/groupDbServices";
import {body, validationResult} from "express-validator";

const router = express.Router();

router.get('/', protectUser, async (req:UserAuthenticatedReq, res) => {
   const userId = req.user.id;

   const result = await userGetAllRequests(userId);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

router.get('/:id', protectUser, async (req:UserAuthenticatedReq, res) => {
   const error = validationResult(req);
   if (!error.isEmpty())
       return res.status(400).json({error: error.array()});

   const userId = req.user.id;
   const reqId = req.params.id;

   const result = await getRequestById(userId, reqId);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

router.post('/create/:groupId', protectUser, body('memberId').isString(), async (req:UserAuthenticatedReq, res) => {
   const error = validationResult(req);
   if (!error.isEmpty())
       return res.status(400).json({error: error.array()});

   const groupId = Number(req.params.groupId);
   const memberId = Number(req.body.memberId);
   if (isNaN(groupId))
       return res.status(400).json({
           success: false,
           message: 'Invalid group ID',
       });
   if (isNaN(memberId))
       return res.status(400).json({
           success: false,
           message: 'Invalid member ID',
       });

   const groupAdminId = req.user.id;

   const result = await createAddMemberRequest(groupId, memberId, groupAdminId);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

router.put('update-status/:id', protectUser, body('status').isString(), async (req:UserAuthenticatedReq, res) => {
   const error = validationResult(req);
   if (!error.isEmpty())
       return res.status(400).json({error: error.array()});

   const status = req.body.status;
   if (status !== 'rejected' || status === 'approved')
       return res.status(400).json({
           success: false,
           message: "نوع وضعیت نادرست است ❌",
       });

   const reqId = req.params.id;

   const result = await updateGroupRequest(req.user.id, reqId, status);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

export default router;