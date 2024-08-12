import { Request } from "express";
export interface UserAuthenticatedReq extends Request {
    user?: {
        id: number;
    };
}

export interface AdminAuthenticatedReq extends Request {
    admin?: {
        id: string;
    };
}