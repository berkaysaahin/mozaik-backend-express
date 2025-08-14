const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(401);
  console.log(authHeader);
  const token = authHeader.split(' ')[1];
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if (err) return res.sendStatus(403);
      req.user = decoded.username;
      next();
    }
  )
};

const refreshTokenHandler = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;

  const result = await pool.query(
    'SELECT * FROM users WHERE refresh_token = $1 LIMIT 1',
    [refreshToken]
  );
  const user = result.rows[0];
  if (!user) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || user.username !== decoded.username) return res.sendStatus(403);

    const accessToken = jwt.sign(
      { username: user.username, userId: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '60s' }
    );
    res.json({ accessToken });
  });
};


module.exports = { verifyJWT, refreshTokenHandler };