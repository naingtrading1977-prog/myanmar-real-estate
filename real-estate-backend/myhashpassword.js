const bcrypt = require('bcrypt');

async function generateHash() {
  const password = "971977@TunTunNaing";
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log("Hashed Password:", hashedPassword);
}

generateHash();
