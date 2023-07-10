import express ,{json} from 'express';
import {MongoClient,connectionURL,dbName} from './db/mongodb.js';
import { connectToDatabase, insertFakeData } from './db/mongodb.js';
import userRouter from './router/user.js'
import dealershipRouter from './router/dealership.js';
const app = express();

app.use(json());
// app.use(userRouter)

const port=process.env.PORT || 8000;
connectToDatabase()
  .then(() => {
    console.log('Connected to MongoDB');
    return insertFakeData();
  })
  .then(() => {
    console.log('Inserted fake data');
    // Use the routers
    app.use('/users', userRouter);
    app.use('/dealerships', dealershipRouter);

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB or inserting fake data:', error);
  });

