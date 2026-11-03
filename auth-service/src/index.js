import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(JSON.stringify({ level: "info", service: "auth", msg: `escuchando en ${PORT}` }));
});