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

export const getPayDuesByUserId = async (userId:number) => {
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

        const data = [];
        const payDues = await db.payDues.findMany({
            where: {
                OR: [
                    {debtorId: userId},
                    {creditorId: userId},
                ]
            },
        });

        for (const payDue of payDues) {
            const group = await db.groups.findFirst({
                where: {
                    id: payDue.groupId,
                },
                select: {
                    name: true,
                },
            });

            let targetUser;
            if (payDue.debtorId === userId)
                targetUser = await db.users.findFirst({
                    where: {
                        id: payDue.creditorId,
                    },
                    select: {
                        name: true,
                        phone: true,
                    }
                });
            else
                targetUser = await db.users.findFirst({
                    where: {
                        id: payDue.debtorId,
                    },
                    select: {
                        name: true,
                        phone: true,
                    }
                });

            const cardInfo = await db.cards.findFirst({
                where: {
                    id: payDue.cardId,
                },
                select: {
                    cardPan: true,
                }
            });

            data.push({
                payDueInfo: payDue,
                groupName: group.name,
                targetUserInfo: targetUser,
                cardInfo: cardInfo,
            });
        }

        return {
            success: true,
            data,
        }
    } catch (error) {
        logger.error(error, {
            section: "getPayDuesByUserId",
        });

        return {
            success: false,
            message: 'خطا در دریافت اطلاعات ❌',
        }
    }
}