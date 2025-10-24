import { Router } from "express";
import { Login } from "../controllers/authController.js"

const router = Router()
router.post('/', Login)
export default router;