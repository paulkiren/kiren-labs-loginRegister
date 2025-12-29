import express from "express";
import { userController } from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
