import express from "express";
import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.util.js";

const router = express.Router();

//-------------------------사용자 회원가입 API-------------------------//

router.post("/sign-up", async (req, res, next) => {
  //이메일, 비밀번호, 비밀번호 확인, 이름을 Request Body(req.body)로 전달 받는다
  const { email, password, passwordConfirm, name } = req.body;

  //동일한 email을 가진 사람이 있는지 확인
  const isExistedUser = await prisma.users.findFirst({
    where: { email },
  });
  if (isExistedUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일 입니다." });
  }

  //사용자 생성
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  return res.status(201).json({ message: "회원가입이 완료되었습니다." });
});

export default router;
