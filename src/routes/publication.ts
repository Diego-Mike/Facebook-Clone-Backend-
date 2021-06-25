import { Router } from "express";

import {
  getPublications,
  postPublication,
  deletePublication,
  editPublication,
  likePublication,
  createComment,
  editComment,
  likeComment,
  singlePublication,
  deleteComment
} from "../controllers/publication";
import { AuthMiddleware } from "../middleware/auth";

const router: Router = Router();

router.get("/", getPublications);
router.get("/singlePub/:publicationId", singlePublication);
router.post("/", AuthMiddleware, postPublication);
router.delete("/delete/:publicationId", AuthMiddleware, deletePublication);
router.patch("/edit/:publicationId", AuthMiddleware, editPublication);
router.patch("/like/:publicationId", AuthMiddleware, likePublication);
router.patch("/comment/:publicationId", AuthMiddleware, createComment);
router.patch("/editComment/:publicationId", AuthMiddleware, editComment);
router.patch("/likeComment/:publicationId", AuthMiddleware, likeComment);
router.delete("/deleteComment/:publicationId", AuthMiddleware, deleteComment);

export default router;
