import db from "../db";
import logger from "../../core/logger";

export const createGroup = async (name: string, userId: number) => {
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
                userId
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
            section: "createNewGroup",
        });

        return {
            success: false,
            message: "خطایی تو ساخت گروه رخ داد 🤐❌",
        }
    }
}

export const getAllGroups = async (userId: number) => {
    try {
        const groups = await db.groups.findMany({
            where: {
                userId,
            }
        });

        return {
            success: true,
            groups,
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

export const createAddMemeberRequest = async (groupId: number, userId: number) => {
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

        await db.groupRequest.create({
            data: {
                userId,
                groupId,
            }
        });

        return {
            success: true,
            message: "درخواست جوین به گروه مورد نظر برای دوستت ارسال شد 😎✅",
        }
    } catch (error) {
        logger.error(error, {
            section: "createAddMemeberRequest",
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

        return {
            success: true,
            reqs: groupRequests,
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

        const request = await db.groupRequest.findUnique({
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

        if (request.status === 'approve') {
            await db.groupMembers.create({
                data: {
                    groupId: request.groupId,
                    isAdmin: false,
                    userId,
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