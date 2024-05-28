import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/require-access-token.middleware.js";
import { prisma } from "../utils/prisma.util.js";
import Joi from "joi";

const router = express.Router();

const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "이메일 형식이 올바르지 않습니다.",
    "any.required": "이메일을 입력해 주세요.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "비밀번호는 6자리 이상이어야 합니다.",
    "any.required": "비밀번호를 입력해 주세요.",
  }),
  passwordConfirm: Joi.string().required().messages({
    "any.required": "비밀번호 확인을 입력해 주세요.",
  }),
  name: Joi.string().required().messages({
    "any.required": "이름을 입력해 주세요.",
  }),
});

const signInSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "이메일 형식이 올바르지 않습니다.",
    "any.required": "이메일을 입력해 주세요.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "비밀번호는 6자리 이상이어야 합니다.",
    "any.required": "비밀번호를 입력해 주세요.",
  }),
});

//-------------------------사용자 회원가입 API-------------------------//

router.post("/sign-up", async (req, res, next) => {
  try {
    const { error, value } = signUpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    //이메일, 비밀번호, 비밀번호 확인, 이름을 Request Body(req.body)로 전달 받는다
    const { email, password, passwordConfirm, name } = req.body;

    // 비밀번호와 비밀번호 확인이 일치하는지 확인
    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json({ message: "입력 한 두 비밀번호가 일치하지 않습니다" });
    }

    //동일한 email을 가진 사람이 있는지 확인
    const isExistedUser = await prisma.users.findFirst({
      where: { email },
    });
    if (isExistedUser) {
      return res.status(409).json({ message: "이미 가입 된 사용자입니다." });
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
  } catch (err) {
    next(err);
  }
});

//---------------------------사용자 로그인 API-------------------------------//

//이메일, 비밀번호를 Request Body(req.body)로 전달 받는다
router.post("/sign-in", async (req, res, next) => {
  try {
    // Request Body 유효성 검사
    const { error, value } = signInSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    //전달받은 email에 해당하는 사용자가 있는지 확인
    const user = await prisma.users.findFirst({ where: { email } });
    //인증정보가 유효하지 않은 경우
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "인증 정보가 유효하지 않습니다." });
    }

    //로그인에 성공하면, 사용자에게 JWT 발급
    const token = jwt.sign(
      {
        userId: user.userId,
      },
      process.env.SECRET_KEY,
      { expiresIn: "12h" },
    );

    res.cookie("authorization", `Bearer ${token}`, {
      maxAge: 12 * 60 * 60 * 1000,
    });
    return res.status(200).json({ message: "로그인에 성공했습니다." });
  } catch (err) {
    next(err);
  }
});

//----------------------사용자 조회 API----------------------//
router.get("/users", authMiddleware, async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

export default router;
