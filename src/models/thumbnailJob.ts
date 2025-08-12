import { Schema, model, Document, Types } from 'mongoose';

export interface IThumbnailJob extends Document {
    userId: Types.ObjectId;
    originalFileName: string;
    fileType: 'image' | 'video';
    originalFilePath: string;
    thumbnailPath?: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
    errorMessage?: string;
}

const thumbnailJobSchema: Schema = new Schema({
    userId: Types.ObjectId,
    originalFileName: String,
    fileType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    originalFilePath: String,
    thumbnailPath: String,
    status: {
        type: String,
        enum: ['pending', 'queued', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
}, { timestamps: true });

export default model<IThumbnailJob>('ThumbnailJob', thumbnailJobSchema);