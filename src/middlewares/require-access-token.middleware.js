import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.util.js";

export default async function authMiddleware(req, res, next) {
  try {
    //클라이언트에게 cookie 전달 받는다
    const { authorization } = req.cookies;
    if (!authorization) throw new Error("토큰이 존재하지 않습니다.");

    //cookie가 Bearer 토큰이 맞는지 확인
    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    //서버에서 발급한 JWT가 맞는지 검증
    const decodedToken = jwt.verify(token, "customized_secret_key");
    const userId = decodedToken.userId;

    //JWT의 'userId'를 통해 사용자 조회
    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });
    if (!user) {
      res.clearCookie("authorization");
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    //req.user에 조회된 사용자 정보 할당
    req.user = user;

    //다음 미들웨어 실행
    next();
  } catch (error) {
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다." });
        break;
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰 인증에 실패하였습니다." });
        break;
      default:
        return res
          .status(401)
          .json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}
