import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export const generateJwt = async (userId: number) => {
    if (!userId)
        return

    const payload = {
        id: userId
    };

    const token = jwt.sign(payload, SECRET, {
        algorithm: "HS256",
        expiresIn: "48h",
    });

    return token;
}

export const generateAdminJwt = async (adminId: string) => {
    if (!adminId)
        return

    const payload = {
        id: adminId,
    };

    const token = jwt.sign(payload, SECRET, {
        algorithm: "HS256",
        expiresIn: "48h",
    });

    return token;
}

export const validateJwt = async (token: string) => {
    try {
        const result = jwt.verify(token, SECRET);

        return result as {id: number}
    } catch (error) {
        return null;
    }
}

export const validateAdminJwt = async (token: string) => {
    try {
        const result = jwt.verify(token, SECRET);
        return result as {id: string}
    } catch (error) {
        return null;
    }
}