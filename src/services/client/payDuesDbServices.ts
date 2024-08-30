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

        const data = [];

        const payDues = await db.payDues.findMany({
            where: {
                groupId,
            }
        });

        for (const payDue of payDues) {
            const debtorName = await db.users.findFirst({
                where: {
                    id: payDue.debtorId,
                },
                select: {
                    name: true,
                }
            });

            const creditorName = await db.users.findFirst({
                where: {
                    id: payDue.creditorId,
                },
                select: {
                    name: true,
                }
            });

            data.push({
                payDue,
                debtorName: debtorName.name,
                creditorName: creditorName.name,
            })
        }

        return {
            success: true,
            data,
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

export const createPayDue = async (
    debtorId: number, creditorId: number, amount: string,
    currency: string, cardId: null | string, groupId: number, description: string
) => {
    try {
        const debtor = await db.users.findFirst({
            where: {
                id: debtorId,
            }
        });
        const creditor = await db.users.findFirst({
            where: {
                id: creditorId,
            }
        });

        if (!debtor || !creditor) {
            return {
                success: false,
                message: "کاربر یافت نشد ❌"
            }
        }

        const isCreditorInGroup = await db.groupMembers.findFirst({
            where: {
                groupId,
                userId: creditorId,
            }
        });
        const isDebtorInGroup = await db.groupMembers.findFirst({
            where: {
                groupId,
                userId: debtorId,
            }
        });
        if (!isCreditorInGroup || !isDebtorInGroup) {
            return {
                success: false,
                message: "کاربر مورد نظر در گروه عضو نیست 🤐❌",
            }
        }

        const payDue = await db.payDues.create({
            data: {
                debtorId,
                creditorId,
                amount,
                currency,
                cardId,
                groupId,
                description,
            }
        });

        return {
            success: true,
            message: "دونگ با موفقیت ثبت شد😎💳✅\nاز الان دوستات میتونن خرجی که کردی رو ببینن و حساب کنن باهات😎🎉",
            data: payDue,
        }
    } catch (error) {
        logger.error(error, {
            section: "createPayDue",
        });

        return {
            success: false,
            message: "خطا در ایجاد دونگ 🤐❌"
        }
    }
}