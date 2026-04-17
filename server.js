const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Headers giả lập browser giống Lazada Adsense
const LAZADA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  "Content-Type": "application/json",
  Accept: "application/json, text/plain, */*",
  Referer: "https://adsense.lazada.vn/index.htm",
  "sec-ch-ua":
    '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "bx-v": "2.5.36",
};

/**
 * GET /health
 * Kiểm tra server còn sống
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * POST /convert
 * Body: { "url": "https://www.lazada.vn/..." }
 * Trả về: { success, shortLink, deepLink }
 *
 * Ví dụ PHP call:
 *   $response = file_get_contents('https://your-app.onrender.com/convert', false, stream_context_create([
 *     'http' => ['method' => 'POST', 'header' => 'Content-Type: application/json',
 *                'content' => json_encode(['url' => $lazadaUrl])]
 *   ]));
 */
app.post("/convert", async (req, res) => {
  const { url, subIdTemplateKey = "" } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "Thiếu trường 'url' trong body",
    });
  }

  try {
    const lazadaRes = await axios.post(
      "https://adsense.lazada.vn/newOffer/link-convert-v2.json",
      { jumpUrl: url, subIdTemplateKey },
      { headers: LAZADA_HEADERS, timeout: 10000 }
    );

    const body = lazadaRes.data;

    if (body.success && body.resultCode === 1) {
      return res.json({
        success: true,
        shortLink: body.data.shortLink,
        deepLink: body.data.deepLink,
      });
    } else {
      return res.status(502).json({
        success: false,
        error: "Lazada trả về lỗi",
        lazadaResponse: body,
      });
    }
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /convert?url=...
 * Tiện cho PHP dùng file_get_contents đơn giản (GET)
 */
app.get("/convert", async (req, res) => {
  const { url, subIdTemplateKey = "" } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "Thiếu query param 'url'",
    });
  }

  try {
    const lazadaRes = await axios.post(
      "https://adsense.lazada.vn/newOffer/link-convert-v2.json",
      { jumpUrl: url, subIdTemplateKey },
      { headers: LAZADA_HEADERS, timeout: 10000 }
    );

    const body = lazadaRes.data;

    if (body.success && body.resultCode === 1) {
      return res.json({
        success: true,
        shortLink: body.data.shortLink,
        deepLink: body.data.deepLink,
      });
    } else {
      return res.status(502).json({
        success: false,
        error: "Lazada trả về lỗi",
        lazadaResponse: body,
      });
    }
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Lazada Proxy đang chạy trên cổng ${PORT}`);
});
