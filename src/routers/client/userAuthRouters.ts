import express from "express";
import {body, validationResult} from "express-validator";
import logger from "../../core/logger";
import {signUserByVerificationCode, verifyCode} from "../../services/client/userDbServices";
import {sendVerificationCode} from "../../core/sms";
import {generateJwt} from "../../core/jwt";

const router = express.Router();
router.get("/check", async (req, res) => {
    return res.json({
        sucees: true,
        message: "fucking works"
    })
})

router.post("/phone", body('phone').isString(), async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    let phone = req.body.phone;
    phone = phone.replace("+98", "0");
    if ((phone as string).startsWith("98")) {
        phone = (phone as string).replace("98", "0");
    }

    logger.info(`user with phone: ${phone} is trying to signin, sending verfication code`, {
        section: "userPhoneSign",
    });

    const result = await signUserByVerificationCode(phone);

    if (!result.success)
        return res.status(400).json(result);

    if (!result.sent) {
        const sms = await sendVerificationCode(result.phone, result.code);
        if (!sms.success)
            return res.status(400).json(sms);

        return res.json(sms);
    }

    return res.json({
        success: true,
        message: "کد تایید قبلا ارسال شده است ❗",
    });
});

router.post('/verify-phone', body('phone').isString(), body('code').isString(), async (req, res) => {
    let phone: string = req.body.phone;
    phone = phone.replace("+98", "0");
    if (phone.startsWith("98"))
        phone = phone.replace("98", "0");

    const code: string = req.body.code;

    const result = await verifyCode(phone, code);

    if (!result.success) {
        return res.status(400).json(result)
    }

    const token = generateJwt(result.user.id)

    return res.json({
        success: true,
        message: `صحت سنجی شماره ${phone} با موفقیت انجام شد✔`,
        token,
        token_type: "Bearer"
    });
});

export default router;