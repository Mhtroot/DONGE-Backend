import db from "../db";
import logger from "../../core/logger";

export const generateVerificationCode = async (userId: number, phone: string) => {
    logger.info(`generating verification code for user: ${userId}`, {
        section: 'generateVerificationCode',
    });

    const code: number = Math.floor(10000 + Math.random() * 90000);
    const minutes: number = 2;

    return db.verificationCode.create({
        data: {
            code: code.toString(),
            userId: userId,
            phone: phone,
            expiredAt: new Date(Date.now() + minutes * 60 * 1000),
        }
    });
};

export const signUserByVerificationCode = async (phone: string) => {
    try {
        const user = await db.users.findFirst({
            where: {
                phone: phone,
            },
        });

        if (!user) {
            //new user
            logger.info(
                `user with phone: ${phone} not exists and trying to sign in`,
                {
                    section: "signUserByVerificationCode",
                }
            );

            const newUser = await db.users.create({
                data: {
                    phone: phone,
                },
            });

            const newCode = await generateVerificationCode(newUser.id, phone);

            return {
                success: true,
                code: newCode.code,
                phone: phone,
            };
        } else {
            logger.info(
                `user with phone: ${phone} exists, and is trying to sign in`,
                { section: 'signUserByVerificationCode' }
            )

            const code = await db.verificationCode.findFirst({
                where: {
                    userId: user.id,
                    phone: phone,
                },
            });

            if (!code) {
                const newCode = await generateVerificationCode(user.id, user.phone);

                return {
                    success: true,
                    code: newCode.code,
                    phone: user.phone,
                };
            } else {
                if (code.expiredAt < new Date()) {
                    await db.verificationCode.deleteMany({
                        where: {
                            userId: user.id,
                            phone: phone,
                        },
                    });

                    const newCode = await generateVerificationCode(user.id, user.phone);

                    return {
                        success: true,
                        code: newCode.code,
                        phone: phone,
                    }
                } else {
                    return {
                        success: false,
                        message: "کد تایید هنوز منقضی نشده❗❗❗",
                        sent: true,
                    };
                }
            }
        }
    } catch (error) {
        logger.error(error, "signUserByVerificationCode");
        return {
            success: false,
            message: "خطا در دریافت اطلاعات کاربر❌"
        }
    }
}

export const verifyCode = async (phone: string, code: string) => {
    try {
        const user = await db.users.findFirst({
            where: {
                phone: phone
            },
        });

        if (!user)
            return {
                success: false,
                message: "کاربر یافت نشد❌",
                expired: false,
            };

        const verificationCode = await db.verificationCode.findFirst({
            where: {
                phone: phone,
                code: code,
            },
        });

        if (!verificationCode) {
            logger.info(
                `user with phone: ${phone} and code: ${code} verification failed: wrong code`,
                {
                    section: "verifyCode",
                }
            );

            return {
                success: false,
                message: "کد نامعتبر❌",
                expired: false,
            }
        }

        if (verificationCode.expiredAt < new Date()) {
            logger.info(
                `user with phone: ${phone} and code: ${code} verification failed: code expired`,
                {
                    section: "verifyUser",
                }
            );

            return {
                success: false,
                message: "کد منقضی شده است❌",
                expired: true,
            };
        }

        await db.verificationCode.deleteMany({
            where: {
                phone: phone
            },
        });

        if (!user.isVerified) {
            logger.info(
                `user with phone: ${phone} and code: ${code} verification successful and user is active now`,
                {
                    section: "verifyCode",
                }
            );

            await db.users.update({
                where: {
                    id: user.id,
                },
                data: {
                    isVerified: true,
                },
            });
        }

        return {
            success: true,
            message: "کاربر تایید شد✔",
            user: user,
            expired: false,
        };
    } catch (error) {
        logger.error(error, "verifyCode")
        return {
            success: false,
            message: "خطا در سمت سرور❌ لطفا دوباره تلاش کنید❗",
            expired: false,
        };
    }
};

export const createCard = async (cardPan: string, userId: number, cardName: string) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "کاربر یافت نشد ❌",
            }
        }

        const card = await db.cards.findUnique({
            where: {
                cardPan: cardPan,
            }
        });
        if (card) {
            return {
                success: false,
                message: "این شماره کارت قبلا وارد شده ❌😔",
            }
        }

        const newCard = await db.cards.create({
            data: {
                userId: userId,
                cardPan: cardPan,
                cardName: cardName,
            },
        });

        return {
            success: true,
            message: "شماره کارتت با موفقیت ثبت شد ✅😎\nازین ببعد میتونی به دوستات بگی دنگشونو با دنگ بدن😁",
            newCard,
        }
    } catch (error) {
        logger.error(error, {
            section: "addNewCard",
        });

        return {
            success: false,
            message: "متاسفانه نتونستیم شماره کارتتو داشته باشیم ❌😔",
        }
    }
}

export const getAllCards = async (userId: number) => {
    try {
        const user = await db.users.findFirst({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "متاسفانه نتونستیم اطلاعاتت رو دریافت کنیم 😔💔",
            }
        }

        const cards = await db.cards.findMany({
            where: {
                userId: userId,
            },
            select: {
                id: true,
                cardPan: true,
                cardName: true,
            },
        });

        if (!cards || cards.length === 0) {
            return {
                success: false,
                message: "هیچ کارتی ثبت نکردی 💔",
            }
        }

        return {
            success: true,
            cards: cards
        }
    } catch (error) {
        logger.error(error, {
            section: "getAllCards",
        });

        return {
            success: false,
            message: "متاسفانه نتونستیم به کارت هات دسترسی پیدا کنیم 😔💸",
        }
    }
}

export const getCardByPan = async (userId: number, cardPan: string) => {
    try {
        const user = await db.users.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "متاسفانه نتونستیم اطلاعاتت رو دریافت کنیم 😔💔",
            }
        }

        const card = await db.cards.findUnique({
            where: {
                cardPan: cardPan,
                userId: userId,
            }
        });

        if (!card) {
            return {
                success: false,
                message: "همچین کارتی نداریم 😴❌",
            }
        }

        const pays = await db.payDues.findMany({
            where: {
                cardId: card.id,
            },
        });

        let debts = 0;
        let credits = 0;

        pays.forEach((pay) => {
            const amount = Number(pay.amount);

            if (pay.debtorId === userId)
                debts += amount;
            else if (pay.creditorId === userId)
                credits += amount;
        });

        return {
            success: true,
            card: {
                name: card.cardName,
                cardPan,
                debts,
                credits,
            }
        }
    } catch (error) {
        logger.error(error, {
            section: "getCardByPan",
        });

        return {
            success: false,
            message: "خطایی تو دریافت اطلاعات کارت رخ داد 🤐💳❌",
        }
    }
}