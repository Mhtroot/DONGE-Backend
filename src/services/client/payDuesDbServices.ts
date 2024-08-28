import db from "../db";
import logger from "../../core/logger";

export const getPayDuesByGroupId = async (groupId: number, userId:number) => {
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

        const isMember = await db.groupMembers.findFirst({
            where: {
                groupId,
                userId,
            }
        });
        if (!isMember) {
            return {
                success: false,
                message: "access denied",
            }
        }

        const payDues = await db.payDues.findMany({
            where: {
                groupId,
            }
        });

        return {
            success: true,
            data: payDues,
        }
    } catch (error) {
        logger.error(error, {
            section: "getPayDuesByGroupId",
        });

        return {
            success: false,
            message: "خطا در دریافت اطلاعات ❌",
        }
    }
}