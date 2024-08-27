import express from "express";
import {protectUser} from "../../middlewares/auth";
import {body, validationResult} from "express-validator";
import {UserAuthenticatedReq} from "../../interfaces/AuthenticatedRequest";
import {
    createGroup, deleteGroupMember,
    getAllGroups,
    getGroupById, getGroupMembers,
    updateGroupAdmin,
    updateGroupDetails
} from "../../services/client/groupDbServices";

const router = express.Router();

router.get('/', protectUser, async (req:UserAuthenticatedReq, res) => {
    const userId = req.user.id;

    const result = await getAllGroups(userId);
    if (!result.success)
        return res.status(400).json(result);

    return res.json(result);
});

router.get('/:id', protectUser, async (req:UserAuthenticatedReq, res) => {
   const error = validationResult(req);
   if (!error.isEmpty())
       return res.status(400).json({error: error.array()});

   const groupId = Number(req.params.id);
   if (isNaN(groupId))
       return res.status(400).json({
           success: false,
           message: "Group id must be an Number"
       });


   const userId = req.user.id;

   const result = await getGroupById(userId, groupId);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

router.post("/create", protectUser, body('name').isString(), body('description').isString(), async (req:UserAuthenticatedReq, res) => {
    const error = validationResult(req);
    if (!error.isEmpty())
        return res.status(400).json({error: error.array()});

    const data = {
        userId: req.user.id,
        groupName: req.body.name,
        description: req.body.description
    }

    const result = await createGroup(data.groupName, data.userId, data.description);
    if (!result.success)
        return res.status(400).json(result);

    return res.json(result);
});

router.put('/update/:groupId', protectUser, body('name').isString(), body('desc').isString(), async (req:UserAuthenticatedReq, res) => {
   const error = validationResult(req);
   if (!error.isEmpty())
       return res.status(400).json({error: error.array()});

   const groupId = Number(req.params.groupId);
   if (isNaN(groupId))
       return res.status(400).json({
           success: false,
           message: "Group id must be an Number"
       });

   const data = {
       name: req.body.name,
       desc: req.body.desc,
   }

   const result = await updateGroupDetails(groupId, data.name, req.user.id, data.desc);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

router.put('/update-admin/:groupId', protectUser, body('phoneNumber').isString(), body('isAdmin').isBoolean(), async (req:UserAuthenticatedReq, res) => {
   const error = validationResult(req);
   if (!error.isEmpty())
       return res.status(400).json({error: error.array()});

   const data = {
       phoneNumber: req.body.phoneNumber,
       isAdmin: req.body.isAdmin,
       adminId: req.user.id,
       groupId: Number(req.params.groupId)
   }

   data.phoneNumber = data.phoneNumber.replace("+98", "0");
   if ((data.phoneNumber as string).startsWith("98")) {
       data.phoneNumber = (data.phoneNumber as string).replace("98", "0");
   }

   if (isNaN(Number(data.phoneNumber)) || data.phoneNumber.length !== 11)
       return res.status(400).json({
           success: false,
           message: "Phone number incorrect"
       });
   if (isNaN(data.groupId))
       return res.status(400).json({
           success: false,
           message: "Group id must be an Number"
       });

   const result = await updateGroupAdmin(data.groupId, data.adminId, data.phoneNumber, data.isAdmin=== 'true' ? true:false);
   if (!result.success)
       return res.status(400).json(result);

   return res.json(result);
});

router.get('/members/:id', protectUser, async (req:UserAuthenticatedReq, res) => {
    const groupMemberId = Number(req.params.id);
    if (isNaN(groupMemberId))
        return res.status(400).json({
            success: false,
            message: "Group id must be an Number"
        });

    const result = await getGroupMembers(groupMemberId, req.user.id);
    if (!result.success)
        return res.status(400).json(result);

    return res.json(result);
});

router.delete('/delete-member/:memberGroupId', protectUser, async (req:UserAuthenticatedReq, res) => {
    const memberGroupId = Number(req.params.memberGroupId);
    if (isNaN(memberGroupId))
        return res.status(400).json({
            success: false,
            message: "Group id must be an Number"
        });

    const result = await deleteGroupMember(req.user.id, memberGroupId);
    if (!result.success)
        return res.status(400).json(result);

    return res.json(result);
});

export default router;