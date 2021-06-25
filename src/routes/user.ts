import { Router } from "express";
import {
  register,
  login,
  updatePhoto,
  singleUser,
  getAll,
  fullUsers,
  sendNotification,
  acceptNotification,
  deleteNotification
} from "../controllers/user";
import { AuthMiddleware } from "../middleware/auth";

const router: Router = Router();

router.get("/", fullUsers);
router.get("/allU/:id", getAll);
router.get("/singleU/:id", singleUser);
router.post("/register", register);
router.post("/login", login);
router.patch("/update/:id", AuthMiddleware, updatePhoto);
router.patch("/notification/:id", AuthMiddleware, sendNotification);
router.patch("/acceptNotification/:id", AuthMiddleware, acceptNotification);
router.delete("/deleteNotification/:id", AuthMiddleware, deleteNotification);

export default router;
