import express from 'express';
import { postUploadController } from '../controllers/upload.controller';
import upload from '../middleware/multer';
import { authMiddleware } from '../middleware/middleware';

const router = express.Router();

router.post('/uploads', authMiddleware, upload.array("files", 5), postUploadController);


export default router;