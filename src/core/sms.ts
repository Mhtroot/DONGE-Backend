import logger from "./logger";

export async function sendVerificationCode(phone: string, code: string) {
    try {
        logger.info(`Sent verification code to ${phone}`);
        console.log(code);

        return {
            success: true,
            message: "کد تایید با موفقیت ارسال شد✅"
        };
    } catch (error) {
        console.log(error);

        logger.error(error, "sentVerificationCode");
        return {
            success: false,
            message: "ارسال کد تایید با خطا مواجه شد❌",
        };
    }
}