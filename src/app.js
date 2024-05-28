import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import errorHandlerMiddleware from "./middlewares/error-handler.middleware.js";
import UsersRouter from "./routers/users.router.js";

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use("/auth", [UsersRouter]);
app.use(errorHandlerMiddleware);

app.get("/", (req, res) => {
  res.send("Welcome to the Home Page!");
});

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
