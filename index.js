module.exports = (req, res) => {
  res.writeHead(302, {
    Location:
      "https://discordapp.com/api/oauth2/authorize?client_id=592968118905733120&permissions=0&scope=bot"
  });
  res.end();
};
