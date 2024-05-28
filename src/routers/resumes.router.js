import express from "express";
import authMiddleware from "../middlewares/require-access-token.middleware.js";
import { prisma } from "../utils/prisma.util.js";

const router = express.Router();

//-------------------게시글 생성 API---------------------//
router.post("/resumes", authMiddleware, async (req, res, next) => {
  //게시글 작성하는 클라이언트가 로그인된 사용자인지 검증
  const { userId } = req.user;
  //게시글 생성을 위한 'title', 'content'를 body로 전달받는다.
  const { title, content } = req.body;

  //Resumes 테이블에 게시글 생성
  const resume = await prisma.resumes.create({
    data: {
      userId,
      title,
      content,
    },
  });

  return res.status(201).json({ data: resume });
});

//---------------------------이력서 목록 조회 API------------------------------//
router.get("/resumes", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const resumes = await prisma.resumes.findMany({
    where: {
      userId: userId,
    },
    select: {
      resumeId: true,
      title: true,
      content: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { name: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({ data: resumes });
});

//-----------------------------------이력서 상세조회 API-------------------------------------//
router.get("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  const { resumeId } = req.params;
  const { userId } = req.user;
  const resume = await prisma.resumes.findFirst({
    where: { resumeId: +resumeId, userId: userId },
    select: {
      resumeId: true,
      title: true,
      content: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { name: true },
      },
    },
  });

  return res.status(200).json({ data: resume });
});

export default router;
