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

//----------------------------이력서 수정 API----------------------------//
router.patch("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  const { resumeId } = req.params;
  const { userId } = req.user;
  const { title, content } = req.body;

  //회원 본인 이력서만 한정
  const resume = await prisma.resumes.findFirst({
    where: { resumeId: +resumeId, userId: userId },
  });

  //이력서가 없는 경우
  if (!resume) {
    return res.status(404).json({ message: "이이력서가 존재하지 않습니다." });
  }

  //이력서 부분수정
  const updatedResume = await prisma.resumes.update({
    where: { resumeId: +resumeId },
    data: { title: title || undefined, content: content || undefined },
  });

  return res.status(200).json({ data: updatedResume });
});

//---------------------------------이력서 삭제 API----------------------------//

router.delete("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  const { resumeId } = req.params;
  const { userId } = req.user;

  //회원 본인 이력서만 한정
  const resume = await prisma.resumes.findFirst({
    where: { resumeId: +resumeId, userId: userId },
  });

  //이력서가 없는 경우
  if (!resume) {
    return res.status(404).json({ message: "이력서가 존재하지 않습니다." });
  }
  //이력서 삭제
  const deleteResume = await prisma.resumes.delete({
    where: { resumeId: +resumeId },
  });

  return res.status(204).end();
});

export default router;
