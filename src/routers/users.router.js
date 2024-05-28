import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/require-access-token.middleware.js";
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

//---------------------------사용자 로그인 API-------------------------------//

//이메일, 비밀번호를 Request Body(req.body)로 전달 받는다
router.post("/sign-in", async (req, res, next) => {
  const { email, password } = req.body;
  //전달받은 email에 해당하는 사용자가 있는지 확인
  const user = await prisma.users.findFirst({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
  }
  //전달받은 'password'를 저장된 'password'를 bcrypt를 이용해 검증
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }
  //로그인에 성공하면, 사용자에게 JWT 발급
  const token = jwt.sign(
    {
      userId: user.userId,
    },
    "customized_secret_key",
  );

  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인에 성공했습니다." });
});

//----------------------사용자 조회 API----------------------//
router.get("/users", authMiddleware, async (req, res, next) => {
  //클라이언트가 로그인된 사용자인지 검증
  const { userId } = req.user;
  //사용자 테이블 조회
  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    //특정 컬럼 조회
    select: {
      userId: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  //사용자 상세정보 반환
  return res.status(200).json({ data: user });
});

export default router;
