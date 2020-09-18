const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('Successfully Connected To Database');
  })
  .catch(() => {
    console.log('Unable To Connect To Database');
  });

module.exports = mongoose;
