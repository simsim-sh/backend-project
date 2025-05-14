const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database.js");
const authRoute = require("./routes/authRoute.js");

dotenv.config();

const app = express();
connectDB();

app.use(express.json());
app.use(cookieParser());

app.use(cors());

//  Routes
app.use("/api/auth", authRoute);

const port = process.env.PORT || 2500;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
