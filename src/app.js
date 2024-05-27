import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use("/api", []);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
