
import { Types } from "mongoose";
import ThumbnailJob, { IThumbnailJob } from "../models/thumbnailJob";
import thumbnailQueue from "../queues/thumbnailQueue";

export const createThumbnailJob = async (userId: Types.ObjectId, originalFileName: string, fileType: "image" | "video", originalFilePath: string
): Promise<IThumbnailJob> => {

    const job = new ThumbnailJob({
        userId,
        originalFileName,
        fileType,
        originalFilePath,
        status: "pending",
    }) as IThumbnailJob & { _id: Types.ObjectId };
    await job.save();

    
    // Add job to BullMQ queue
    await thumbnailQueue.add(
        `thumbnail-job-${job._id}`,
        {
            jobId: job._id.toString(), 
            userId: userId.toString(),
            filePath: originalFilePath,
            fileType,
        },
        {
            jobId: job._id.toString(), 
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
        }
    );

    // 3. Update status → queued
    job.status = "queued";
    await job.save();

    return job;
}