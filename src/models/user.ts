import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    name?: string;
    email: string;
    password?: string;
    isTerms?: boolean;
}

const userSchema: Schema = new Schema({
    name: String,
    email: String,
    password: String,
    isTerms: { type: Boolean, default: false }
}, { timestamps: true });

export default model<IUser>('User', userSchema);    