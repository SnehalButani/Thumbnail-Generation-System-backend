import { createClient } from "redis";
import { Types } from "mongoose";
import { Worker } from "bullmq";
import ThumbnailJob, { IThumbnailJob } from "../models/thumbnailJob";
import { spawn } from "child_process";
import fs from "fs";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { getBullMQConnection } from "../queues/thumbnailQueue";
import { setTimeout } from "timers/promises";
import { __dirname, path } from "../utils/path";

const redisPublisher = createClient({ url: process.env.REDIS_URL });
await redisPublisher.connect();

async function emitJobUpdate(jobData: {
  jobId: string;
  userId: string;
  status: string;
  thumbnailUrl?: string;
  error?: string;
}) {
  await redisPublisher.publish("job_updates", JSON.stringify(jobData));
}

const processVideoThumbnail = async ({
  jobId,
  inputPath,
  outputPath,
}: {
  jobId: string;
  inputPath: string;
  outputPath: string;
}) => {
  const tempDir = path.join(__dirname, "..", "uploads", "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const tempFramePath = path.join(tempDir, `${jobId}_thumbnail`);

  await new Promise<void>((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error("FFmpeg not found"));

    const ffmpeg = spawn(ffmpegPath, [
      "-i", inputPath,
      "-vf", "thumbnail,scale=128:128",
      "-frames:v", "1",
      "-f", "image2",         
      tempFramePath ,
    ]);

    ffmpeg.stderr.on("data", (data) => {
      console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.on("error", reject);

    ffmpeg.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  await sharp(tempFramePath).resize(128, 128).toFile(outputPath);

  try {
    fs.unlinkSync(tempFramePath);
  } catch (err) {
    console.error("Temp cleanup error:", err);
  }
};

const initWorker = () => {
  const worker = new Worker(
    "thumbnail-queue",
    async (job) => {
      const { jobId } = job.data;

      const jobDoc = await ThumbnailJob.findById(jobId) as IThumbnailJob & { _id: Types.ObjectId };
      if (!jobDoc) throw new Error(`Job ${jobId} not found`);

      try {
        await setTimeout(1000);

        jobDoc.status = "processing";
        await jobDoc.save();
        await emitJobUpdate({
          jobId: jobDoc._id.toString(),
          userId: jobDoc.userId.toString(),
          status: "processing",
        });

        const fullOriginalPath = path.join(__dirname, "..", jobDoc.originalFilePath);

        const thumbnailsDir = path.join(__dirname, "..", "uploads", "thumbnails");
        if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

        const fullOutputPath = path.join(thumbnailsDir, `${jobId}.jpg`);
        const relativeOutputPath = `uploads/thumbnails/${jobId}.jpg`;

        if (jobDoc.fileType === "image") {
          await sharp(fullOriginalPath)
            .resize(128, 128)
            .withMetadata() 
            .jpeg({ quality: 90 }) 
            .toFile(fullOutputPath);
        } else {
          await processVideoThumbnail({
            jobId,
            inputPath: fullOriginalPath,
            outputPath: fullOutputPath,
          });
        }

        jobDoc.thumbnailPath = relativeOutputPath;
        jobDoc.status = "completed";
        await jobDoc.save();

        await emitJobUpdate({
          jobId: jobDoc._id.toString(),
          userId: jobDoc.userId.toString(),
          status: "completed",
          thumbnailUrl: relativeOutputPath,
        });

        console.log(`✅ Job ${jobId} completed`);
        return { success: true, outputPath: relativeOutputPath };
      } catch (error: any) {
        jobDoc.status = "failed";
        jobDoc.errorMessage = error.message;
        await jobDoc.save();

        await emitJobUpdate({
          jobId: jobDoc._id.toString(),
          userId: jobDoc.userId.toString(),
          status: "failed",
          error: error.message,
        });

        throw error;
      }
    },
    {
      connection: getBullMQConnection(),
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5"),
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    }
  );

  worker.on("failed", (job, err) =>
    console.error(`💥 Job ${job?.id} failed:`, err)
  );
  console.log("🚀 Worker started...");
  return worker;
};

const worker = initWorker();

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await worker.close();
  await redisPublisher.quit();
  process.exit(0);
});
