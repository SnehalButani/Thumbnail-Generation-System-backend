import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/user";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
    user?: IUser
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authorization token missing or invalid",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = {
            id: decoded.id,
            email: decoded.email,
        } as IUser;

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
