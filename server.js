import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Home route
app.get("/", (req, res) => {
  res.render("index", { data: null, error: null });
});

// ✅ TEST ROUTE (to verify server works)
app.get("/test", (req, res) => {
  console.log("🔥 TEST ROUTE HIT");
  res.send("TEST WORKING");
});

// ✅ MAIN ROUTE
app.post("/check", async (req, res) => {
  try {
    console.log("🔥 /check route HIT");

    let { lat, lng } = req.body;

    console.log("RAW:", lat, lng);

    // Convert to numbers
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    console.log("PARSED:", lat, lng);

    // Validate
    if (isNaN(lat) || isNaN(lng)) {
      return res.render("index", {
        data: null,
        error: "Invalid latitude or longitude",
      });
    }

    // API call
    const response = await axios.get("https://api.openuv.io/api/v1/uv", {
      params: { lat, lng },
      headers: {
        "x-access-token": process.env.API_KEY,
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    const result = response.data.result;

    const uv = result.uv;
    const ozone = result.ozone;

    let advice = "";
    let color = "";
    let category = "";

    if (uv < 3) {
      category = "Low";
      advice = "No protection needed 😎";
      color = "#4CAF50";
    } else if (uv < 6) {
      category = "Moderate";
      advice = "Use sunscreen 🧴";
      color = "#FFC107";
    } else if (uv < 8) {
      category = "High";
      advice = "Wear SPF 30+ & sunglasses 🕶️";
      color = "#FF5722";
    } else if (uv < 11) {
      category = "Very High";
      advice = "Avoid sun & use SPF 50+ ☀️";
      color = "#F44336";
    } else {
      category = "Extreme";
      advice = "Stay indoors 🚫☀️";
      color = "#9C27B0";
    }

    const time = new Date().toLocaleString();

    res.render("index", {
      data: { uv, ozone, advice, color, category, time },
      error: null,
    });

  } catch (error) {
    console.log("❌ ERROR:", error.response?.status);
    console.log("❌ DATA:", error.response?.data);

    res.render("index", {
      data: null,
      error: "Failed to fetch UV data",
    });
  }
});

// Server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// For deployment
export default app;