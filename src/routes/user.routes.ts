import { Router } from "express";
import { validate } from "../middleware/validate";
import { signInSchema, signUpSchema } from "../schemas/user.schema";
import { signInController, signUpController } from "../controllers/user.controller";

const router = Router();

router.post('/sign-up', validate(signUpSchema), signUpController);
router.post('/sign-in', validate(signInSchema), signInController);

export default router;