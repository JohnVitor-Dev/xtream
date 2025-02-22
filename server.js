const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 8080;
const IPTVurl = process.env.IPTV_URL;
const IPTVuser = process.env.IPTV_USER;
const IPTVpass = process.env.IPTV_PASS;
const ServerUser = process.env.SERVER_USER;
const ServerPass = process.env.SERVER_PASS;
const userInfoUrl = process.env.USER_INFO_URL;

// Função para carregar JSON
const loadJson = (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const loadJsonRemote = async () => {
  // Exemplo para carregar informações remotamente (se necessário)
  try {
    const response = await axios.get(userInfoUrl);
    return response.data;
  } catch (error) {
    console.error(`Erro ao acessar o arquivo user_info.json:`, error.message);
    throw new Error("Não foi possível carregar as informações do usuário.");
  }
};

// Middleware de autenticação
app.use(async (req, res, next) => {
  const { username, password } = req.query;
  const { user_info } = loadJson("user_info.json");
  console.log(`URL completa: ${req.protocol}://${req.get("host")}${req.originalUrl}`);

  if (
    (username === user_info.username && password === user_info.password) ||
    (!username && !password)
  ) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Endpoint principal – redireciona para o outro site para determinadas ações
app.get("/player_api.php", async (req, res) => {
  const { action, vod_id, series_id } = req.query;

  if (!action) {
    return res.json(loadJson("user_info.json"));
  }

  switch (action) {
    case "get_vod_info": {
      if (!vod_id) {
        return res.status(400).json({ error: "Parâmetro vod_id é necessário" });
      }
      // Constrói a URL remota para VOD
      const vodUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_vod_info&vod_id=${vod_id}`;
      console.log(`Redirecionando para: ${vodUrl}`);
      return res.redirect(vodUrl);
    }
    case "get_series_info": {
      if (!series_id) {
        return res.status(400).json({ error: "Parâmetro series_id é necessário" });
      }
      // Constrói a URL remota para Series
      const seriesUrl = `${IPTVurl}/player_api.php?username=${IPTVuser}&password=${IPTVpass}&action=get_series_info&series_id=${series_id}`;
      console.log(`Redirecionando para: ${seriesUrl}`);
      return res.redirect(seriesUrl);
    }
    case "get_live_streams": {
      const live = loadJson("filtered_live_streams.json");
      return res.json(live);
    }
    case "get_vod_streams": {
      const vod = loadJson("filtered_vod_streams.json");
      return res.json(vod);
    }
    case "get_series": {
      const series = loadJson("filtered_series_streams.json");
      return res.json(series);
    }
    case "get_live_categories": {
      const liveCategories = loadJson("filtered_live_categories.json");
      return res.json(liveCategories);
    }
    case "get_vod_categories": {
      const vodCategories = loadJson("filtered_vod_categories.json");
      return res.json(vodCategories);
    }
    case "get_series_categories": {
      const seriesCategories = loadJson("filtered_series_categories.json");
      return res.json(seriesCategories);
    }
    default:
      return res.status(400).json({ error: "Ação inválida" });
  }
});

// Endpoints de redirecionamento para streams
app.get("/movie/user/pass/:id", async (req, res) => {
  const { id } = req.params;
  let streamUrl = `${IPTVurl}/movie/${IPTVuser}/${IPTVpass}/${id}.mp4`;
  res.redirect(streamUrl);
});

app.get("/series/user/pass/:id", async (req, res) => {
  const { id } = req.params;
  let streamUrl = `${IPTVurl}/series/${IPTVuser}/${IPTVpass}/${id}.mp4`;
  res.redirect(streamUrl);
});

app.get("/live/user/pass/:id", async (req, res) => {
  let { id } = req.params;
  id = id.replace('.m3u8', '');
  let streamUrl = `${IPTVurl}/${IPTVuser}/${IPTVpass}/${id}`;
  res.redirect(streamUrl);
});

app.get("/user/pass/:id", async (req, res) => {
  let { id } = req.params;
  id = id.replace('.m3u8', '');
  let streamUrl = `${IPTVurl}/${IPTVuser}/${IPTVpass}/${id}`;
  res.redirect(streamUrl);
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor IPTV rodando na porta ${port}`);
});
