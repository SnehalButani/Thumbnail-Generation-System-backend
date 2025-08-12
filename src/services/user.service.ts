import User from "../models/user";
import _ from "lodash";
import { hashPassword, comparePassword } from "../utils/bcrypt";

export const signUp = async (name: string, email: string, password: string) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("Email already exists");
    }
    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, password: hashedPassword });
    return user;
};


export const signIn = async (email: string, password: string) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new Error("Email and password invalid");
    }
    const isPasswordValid = await comparePassword(password, user.password as string);
    if (!isPasswordValid) {
        throw new Error("Email and password invalid");
    }
    return _.omit(user.toJSON(), ["password"]);
};
 