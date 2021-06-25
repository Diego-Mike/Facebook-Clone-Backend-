import express, { Application, Response } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import userAuth from "./routes/user";
import Publication from "./routes/publication";

dotenv.config();

const app: Application = express();

// Setting Up The Server
// app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors({ optionsSuccessStatus: 200 }));

// Different Routes

app.get("/", (res: Response) => {
  res.send("Welcome !");
});
app.use("/api/user", userAuth);
app.use("/api/publication", Publication);

// Setting Up DB

const Port = process.env.PORT || 5000;

const DB: string = process.env.DB!;

mongoose
  .connect(DB, {
    dbName: "Facebook",
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    app.listen(Port, () => {
      console.log("Server Running Succesfully");
    });
    console.log("DB Conected");
  });
