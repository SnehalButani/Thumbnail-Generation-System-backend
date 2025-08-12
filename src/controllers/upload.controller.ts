import { Request, Response } from "express";
import { IUser } from "../models/user";
import { createThumbnailJob } from "../services/upload.service";
import asyncWrapper from "../utils/handler";
import { __dirname,path } from "../utils/path";

export const postUploadController = asyncWrapper(async (req: Request, res: Response) => {
    if (!req.files || !(req.files as Express.Multer.File[]).length) {
        res.status(400).json({ message: "No files uploaded" });
    }

    const user = req.user as IUser; 
    const files = req.files as Express.Multer.File[];
    const jobs = [];

    for (const file of files) {
        const fileType = file.mimetype.startsWith("image") ? "image" : "video";
    
        const relativePath = path
          .relative(path.join(__dirname, "../uploads"), file.path)
          .replace(/\\/g, "/");
    
        const originalFilePath = `uploads/${relativePath}`;
    
        const job = await createThumbnailJob(
          user.id,
          file.originalname,
          fileType,
          originalFilePath
        );
    
        jobs.push(job);
      }

    res.status(201).json({
        message: "Files uploaded and thumbnail jobs created",
        jobs: jobs.map((job) => ({
            jobId: job._id,
            originalFilePath: job.originalFilePath,
            originalFileName: job.originalFileName,
            status: job.status,
            type: job.fileType,
        })),
    });
});