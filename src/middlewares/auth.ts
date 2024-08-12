import {AdminAuthenticatedReq, UserAuthenticatedReq} from "../interfaces/AuthenticatedRequest";
import {NextFunction, Response} from "express";
import {validateAdminJwt, validateJwt} from "../core/jwt";

export const protectUser = async (req: UserAuthenticatedReq, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization;

    if (!bearer)
        return res.status(401).json({
            message: "NOT AUTHORIZED❌",
        });

    const [, token] = bearer.split(" ");
    if (!token)
        return res.status(401).json({
            message: "NOT AUTHORIZED❌",
        });

    try {
        const user = validateJwt(token);

        if (!user)
            return res.status(401).json({
                message: "INVALID TOKEN❌"
            });

        req.user = {
            id: user.id,
        }
    } catch (error) {
        return res.status(401).json({
            message: "INVALID TOKEN ❌",
        });
    }

    next();
};

export const protectUser = async (req: AdminAuthenticatedReq, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization;

    if (!bearer)
        return res.status(401).json({
            message: "NOT AUTHORIZED❌",
        });

    const [, token] = bearer.split(" ");
    if (!token)
        return res.status(401).json({
            message: "NOT AUTHORIZED❌",
        });

    try {
        const user = validateAdminJwt(token);

        if (!user)
            return res.status(401).json({
                message: "INVALID TOKEN❌"
            });

        req.user = {
            id: user.id,
        }
    } catch (error) {
        return res.status(401).json({
            message: "INVALID TOKEN ❌",
        });
    }

    next();
};