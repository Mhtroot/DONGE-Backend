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