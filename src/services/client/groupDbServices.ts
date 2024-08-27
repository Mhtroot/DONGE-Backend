import db from "../db";
import logger from "../../core/logger";

export const createGroup = async (name: string, userId: number, description: string) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "خطا در دریافت اطلاعات کاربر ❌",
            }
        }

        const newGroup = await db.groups.create({
            data: {
                name,
                userId,
                description,
            }
        });

        await db.groupMembers.create({
            data: {
                userId,
                groupId: newGroup.id,
                isAdmin: true,
            }
        });

        return {
            success: true,
            message: "گروه جدید با موفقیت ایجاد شد 😎✅\nاز حالا میتونی رفیقاتو به گروه اضافه کنی تا دنگاشونو صاف کنن 😁💳",
            group: newGroup,
        }
    } catch (error) {
        logger.error(error, {
            section: "createGroup",
        });

        return {
            success: false,
            message: "خطایی تو ساخت گروه رخ داد 🤐❌",
        }
    }
}

export const getAllGroups = async (userId: number) => {
    try {
        const userGroups = await db.groupMembers.findMany({
            where: {
                userId,
            },
        });

        if (userGroups.length === 0) {
            return {
                success: true,
                message: "هیچ گروهی نداری 💔",
            }
        }

        const groupsArray = [];

        for (const userGroup of userGroups) {
            const group = await db.groups.findFirst({
                where: {
                    id: userGroup.groupId,
                },
            });

            const membersCount = await db.groupMembers.count({
                where: {
                    groupId: userGroup.groupId,
                }
            });

            groupsArray.push({
                group: group,
                membersCount: membersCount,
            });
        }

        return {
            success: true,
            groupsArray,
        }
    } catch (error) {
        logger.error(error, {
            section: "getAllGroups"
        });

        return {
            success: false,
            message: "خطا در دریافت گروه ها ❌",
        }
    }
}

export const updateGroupDetails = async (groupId: number, name: string, userId: number, description: string) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "همچین کاربری نداریم 🤐❌",
            }
        }

        const isAdmin = await db.groupMembers.findFirst({
            where: {
                groupId,
                userId,
            },
            select: {
                isAdmin: true,
            }
        });

        if (!isAdmin.isAdmin) {
            return {
                success: false,
                message: "ازونجایی که ادمین گروه نیستی نمیتونی اطلاعات گروه تغییر بدی 🤐❌",
            }
        }

        const updateGroup = await db.groups.update({
            where: {
                id: groupId,
            },
            data: {
                name,
                description,
            }
        });

        return {
            success: true,
            message: "اطلاعات گروهت با موفقیت آپدیت شد 😎✏",
            updateGroup,
        }
    } catch (error) {
        logger.error(error, {
            section: "updateGroupDetails",
        });

        return {
            success: false,
            message: "خطا در بروز رسانی اطلاعات گروه ❌",
        }
    }
}

export const getGroupById = async (userId: number, groupId: number) => {
    try {
        const group = await db.groups.findUnique({
            where: {
                id: groupId,
                userId,
            }
        });

        if (!group) {
            return {
                success: false,
                message: "چنین گروهی موجود نیست❌",
            }
        }

        const members = await db.groupMembers.findMany({
            where: {
                groupId
            },
        });

        let membersDetails = [];

        for (const member of members) {
            const user = await db.users.findFirst({
                where: {
                    id: member.userId,
                },
                select: {
                    name: true,
                    phone: true,
                }
            });

            const data = {
                user,
                joinedAt: member.joinedAt,
                isAdmin: member.isAdmin,
            }

            membersDetails.push(data);
        }

        return {
            success: true,
            group,
            membersDetails,
        }
    } catch (error) {
        logger.error(error, {
            section: "getGroupById",
        });

        return {
            success: false,
            message: "خطا در دریافت اطلاعات گروه مورد نظر 😔❌",
        }
    }
}

export const addUserToGroup = async (groupId: number, userId: number) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "همچین کاربری نداریم 🤐❌",
            }
        }

        await db.groupMembers.create({
            data: {
                userId,
                groupId,
                isAdmin: false,
            }
        });

        return {
            success: true,
            message: "کاربر با موفقیت به گروه اضافه شد 😁✅",
        }
    } catch (error) {
        logger.error(error, {
            section: "addUserToGroup",
        });

        return {
            success: false,
            message: "خطایی تو اضافه شدن کاربر به گروه رخ داد 🤐❌",
        }
    }
}

export const createAddMemberRequest = async (groupId: number, memberPhoneNumber: string, groupAdminId: number) => {
    try {
        const isAdmin = await db.groupMembers.findFirst({
            where: {
                groupId,
                userId: groupAdminId,
            },
            select: {
                isAdmin: true
            }
        });

        if (!isAdmin) {
            return {
                success: false,
                message: "چون سرپرست گروه نیستی نمیتونیم بهت اجازه اینکارو بدیم 😔💔",
            }
        }

        const user = await db.users.findFirst({
            where: {
                phone: memberPhoneNumber,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "چنین کاربری نداریم 😔❌",
            }
        }

        const req = await db.groupRequest.findMany({
            where: {
                groupId,
                userId: user.id,
            }
        });

        if (req[0]) {
            if (req[0].status === 'pending') {
                return {
                    success: true,
                    message: "درخواستت از قبل برای دوستت ارسال شده\nاگر میخوای دوباره بهش درخواست بدی باید درخواست قبلیت رو حذف کنی 😁",
                }
            }
        }

        await db.groupRequest.create({
            data: {
                userId: user.id,
                groupId,
            }
        });

        return {
            success: true,
            message: "درخواست جوین به گروه مورد نظر برای دوستت ارسال شد 😎✅",
        }
    } catch (error) {
        logger.error(error, {
            section: "createAddMemberRequest",
        });

        return {
            success: false,
            message: "خطایی تو ارسال درخواست رخ داد 😔❌",
        }
    }
}

export const userGetAllRequests = async (userId: number) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "چنین کاربری نداریم 😔❌",
            }
        }

        const groupRequests = await db.groupRequest.findMany({
            where: {
                userId
            }
        });
        if (groupRequests.length === 0) {
            return {
                success: true,
                message: "هیچ درخواستی نداری 😔💔",
            }
        }
        const data = [];

        for (const groupReq of groupRequests) {
            const groupDetails = await db.groups.findUnique({
                where: {
                    id: groupReq.groupId,
                },
                select: {
                    name: true,
                }
            });

            const adminData = await db.users.findUnique({
                where: {
                    id: groupReq.userId
                },
                select: {
                    name: true,
                    phone: true,
                }
            });

            data.push({
                groupName: groupDetails.name,
                sender: adminData,
                groupRequest: groupReq,
            });
        }
        return {
            success: true,
            data: data,
        }
    } catch (error) {
        logger.error(error, {
            section: "userGetAllRequests",
        });

        return {
            success: false,
            message: "خطایی تو دریافت درخواست های شما رخ داد ❌"
        }
    }
}

export const getRequestById = async (userId: number, reqId: string) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "چنین کاربری نداریم 😔❌",
            }
        }

        const request = await db.groupRequest.findUnique({
            where: {
                userId,
                id: reqId,
            }
        });

        if (!request) {
            return {
                success: false,
                message: "چنین درخواستی وجود نداره 🤐❌",
            }
        }

        return {
            success: true,
            groupReq: request,
        }
    } catch (error) {
        logger.error(error, {
            section: "getRequestById"
        });

        return {
            success: false,
            message: "خطایی تو دریافت درخواست مورد نظر رخ داد 😔❌"
        }
    }
}

export const getSentRequests = async (userId: number) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "چنین کاربری نداریم 😔❌",
            }
        }

        const groups = await db.groups.findMany({
            where: {
                userId: userId,
            }
        });

        if (groups.length === 0) {
            return {
                success: false,
                message: "هیچ گروهی نداری 🤐❌"
            }
        }

        const groupRequestsData = [];

        for (const group of groups) {
            const sentGroupReqs = await db.groupRequest.findMany({
                where: {
                    groupId: group.id,
                }
            });

            const data = {
                groupDetails: group,
                requests: sentGroupReqs,
            }

            groupRequestsData.push(data);
        }

        return {
            success: true,
            requests: groupRequestsData,
        }
    } catch (error) {
        logger.error(error, {
            section: "getSentRequests",
        });

        return {
            success: false,
            message: "خطا در دریافت درخواست های ارسال شده ❌",
        }
    }
}

export const updateGroupRequest = async (userId: number, reqId: string, status: string) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "چنین کاربری نداریم 😔❌",
            }
        }

        const request = await db.groupRequest.findUnique({
            where: {
                userId,
                id: reqId,
            }
        });

        if (!request) {
            return {
                success: false,
                message: "چنین درخواستی وجود نداره 🤐❌",
            }
        }

        await db.groupRequest.update({
            where: {
                userId,
                id: reqId,
            },
            data: {
                status: status,
            }
        });

        return {
            success: true,
            message: "وضعیت درخواست با موفقیت تغییر یافت ✅",
        }
    } catch (error) {
        logger.error(error, {
            section: "updateGroupRequest"
        });

        return {
            success: false,
            message: "خطا در تغییر وضعیت درخواست ❌",
        }
    }
}

export const joinGroupByReq = async (userId: number, reqId: string) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "چنین کاربری نداریم 😔❌",
            }
        }

        const request = await db.groupRequest.findMany({
            where: {
                id: reqId,
            }
        });

        if (!request) {
            return {
                success: false,
                message: "چنین درخواستی وجود ندارد 😔❌",
            }
        }

        if (request[0].status === 'approved') {
            await db.groupMembers.create({
                data: {
                    groupId: request[0].groupId,
                    isAdmin: false,
                    userId: request[0].userId,
                }
            });

            await db.groupRequest.delete({
                where: {
                    id: reqId,
                }
            });

            return {
                success: true,
                message: "با موفقیت به گروه مورد نظر عضو شدی😎✅\nاز الان ببعد میتونی دنگاتو اونجا صاف کنی😁💳",
            }
        }

        return {
            success: false,
            message: "خطا در عضویت گروه 🤐❌"
        }
    } catch (error) {
        logger.error(error, {
            section: "joinGroupByReq"
        });

        return {
            success: false,
            message: "خطایی تو عضو شدن به گروه مورد نظر رخ داد 😔😔❌",
        }
    }
}

export const deleteRequest = async (requestId: string) => {
    try {
        const groupReq = await db.groupRequest.findUnique({
            where: {
                id: requestId,
            },
        });

        if (!groupReq) {
            return {
                success: false,
                message: "درخواست مورد نظر یافت نشد 😔💔",
            }
        }

        await db.groupRequest.delete({
            where: {
                id: requestId,
            },
        });

        return {
            success: true,
            message: "درخواست مورد نظر با موفقیت حذف 🗑✅\nهرموقع که دلت خواست بازم میتونی درخواست به دوستات بدی😁🎉",
        }
    } catch (error) {
        logger.error(error, {
            section: "deleteRequest",
        });

        return {
            success: false,
            message: "خطا در حذف درخواست 🤐❌"
        }
    }
}

export const updateGroupAdmin = async (groupId: number, adminId: number, userPhone: string, isAdmin: boolean) => {
    try {
        const user = await db.users.findUnique({
            where: {
                phone: userPhone,
            }
        });

        if (!user) {
            return {
                success: false,
                message: "چنین کاربری نداریم 😔❌",
            }
        }

        const actualGroupAdmin = await db.groups.findFirst({
            where: {
                userId: adminId,
            }
        });
        if (!actualGroupAdmin) {
            return {
                success: false,
                message: "شما صلاحیت لازم برای این کار رو نداری 🤐❌",
            }
        }

        const member = await db.groupMembers.findFirst({
            where: {
                userId: user.id,
                groupId,
            }
        });

        if (!member) {
            return {
                success: false,
                message: "چنین عضوی نداریم توی گروه 🤐❌",
            }
        }
        if (member.isAdmin === isAdmin) {
            return {
                success: true,
                message: "تغییرات از قبل اعمال شده❗",
            }
        }

        await db.groupMembers.updateMany({
            where: {
                groupId,
                userId: user.id,
            },
            data: {
                isAdmin: isAdmin,
            }
        });

        return {
            success: true,
            message: "با موفقیت وضعیت ادمینی رفیقت تغییر پیدا کرد 😎🎉",
        }
    } catch (error) {
        logger.error(error, {
            section: "updateGroupAdmin",
        });

        return {
            success: false,
            message: "خطا در تغییر وضعیت ادمینی ❌",
        }
    }
}

export const getGroupMembers = async (groupId: number, userId: number) => {
    try {
        const group = await db.groups.findFirst({
            where: {
                id: groupId,
            }
        });

        if (!group) {
            return {
                success: false,
                message: "چنین گروهی نداریم 💔",
            }
        }

        const isUserInGroup = await db.groupMembers.findFirst({
            where: {
                groupId,
                userId,
            }
        });
        if (!isUserInGroup) {
            return {
                success: false,
                message: "access denied",
            }
        }

        const groupMembers = await db.groupMembers.findMany({
            where: {
                groupId,
            }
        });

        return {
            success: true,
            groupMembers: groupMembers,
        }
    } catch (error) {
        logger.error(error, {
            section: "getGroupMembers",
        });

        return {
            success: false,
            message: "خطا در دریافت اعضای گروه ❌",
        }
    }
}

export const deleteGroupMember = async (userId: number, memberGroupId: number) => {
    try {
        const memberDetails = await db.groupMembers.findFirst({
            where: {
                id: memberGroupId,
            }
        });

        const groupId = memberDetails.groupId;

        const isUserAdmin = await db.groupMembers.findFirst({
            where: {
                userId,
                groupId,
            }
        });
        if (!isUserAdmin.isAdmin) {
            return {
                success: false,
                message: "شما صلاحیت لازم برای این کار رو نداری 🤐❌",
            }

        }

        const isUserGroupOwner = await db.groups.findFirst({
            where: {
                userId,
                id: groupId,
            }
        });

        if (!isUserGroupOwner) {
            if (memberDetails.isAdmin) {
                return {
                    success: false,
                    message: "کاربر ادمینه، برای اجرای عملیات باید مالک گروه اینکارو انجام بده"
                }
            }

            await db.groupMembers.delete({
                where: {
                    id: memberGroupId,
                }
            });
        }

        await db.groupMembers.delete({
            where: {
                id: memberGroupId,
            }
        });

        return {
            success: true,
            message: "کاربر مورد نظر باموفقیت از گروه حذف شد 🗑✅",
        }
    } catch (error) {
        logger.error(error, {
            section: "deleteGroupMember",
        });

        return {
            success: false,
            message: "خطا در حذف کاربر ❌"
        }
    }
}