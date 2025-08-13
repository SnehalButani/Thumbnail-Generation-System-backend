import multer from 'multer';
import fs from 'fs';
import { Request } from 'express';
import { path, uploadsDir } from '../utils/path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(uploadsDir, 'originals');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isImage = file.mimetype.startsWith('image/');
  const allowedVideos = ['video/mp4', 'video/quicktime'];

  if (isImage || allowedVideos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and selected videos are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export default upload;
