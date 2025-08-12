import { Request, Response } from "express";
import asyncWrapper from "../utils/handler";
import { signUp, signIn } from "../services/user.service";
import { generateToken } from "../utils/jwt";

export const signUpController = asyncWrapper(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const user = await signUp(name, email, password);

    const token = generateToken({ 
        id: user._id, 
        email: user.email 
    });
    
    res.status(201).json({
        success: true,
        message: "User registered successfully",
        token
    });
});

export const signInController = asyncWrapper(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await signIn(email, password);
    
    const token = generateToken({ 
        id: user._id, 
        email: user.email 
    });
    
    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        token
    });
});
