const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

console.log(process.env.NODE_ENV);

const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);

  console.log('UNCAUGHT EXCEPTION ! Shut down ...');
  process.exit(1);
});

// DB
const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB).then(() => console.log('Connected to DB'));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Connect to server on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);

  console.log('UNHANDLE REJECTION ! Shut down ...');
  server.close(() => {
    process.exit(1);
  });
});
