import { MongoClient, ObjectID } from 'mongodb';
import { faker } from '@faker-js/faker';

// h3eQe3OufvwU2xLl
const connectionURL = 'mongodb+srv://pradum19441:h3eQe3OufvwU2xLl@cluster0.rvorudf.mongodb.net/?retryWrites=true&w=majority'
// const connectionURL='mongodb://127.0.0.1:27017'
const dbName = 'delivery-app'
// const client = new MongoClient(connectionURL);

export async function connectToDatabase() {
    try {
      const client = await MongoClient.connect(connectionURL, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = client.db(dbName);
      console.log('Connected to MongoDB');
      return db;
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }
  
  // Function to insert fake data into the collections
  export async function insertFakeData() {
    try {
      const db = await connectToDatabase();
        const collection=db.collection('users')
      const carsCollection = db.collection('cars');
      const dealershipCollection = db.collection('dealership');
      const dealCollection = db.collection('deals');
      const soldVehiclesCollection = db.collection('sold_vehicles');
  
      let numCars = 5;
      const carData = [];
      for (let i = 0; i < numCars; i++) {
        const car = {
          type: faker.vehicle.type(),
          name: faker.vehicle.manufacturer(),
          model: faker.vehicle.model(),
          car_info: {},
        };
        carData.push(car);
      }
  
      await carsCollection.insertMany(carData);
      console.log('Car documents inserted successfully');
  
      const dealershipModel = {
        dealership_email: faker.internet.email(),
        dealership_name: faker.internet.userName(),
        dealership_location: faker.location.city(),
        password: faker.internet.password(),
        dealership_info: faker.lorem.sentences(),
        cars: [],
        deals: [],
        sold_vehicles: [],
      };
  
      const cars = await carsCollection.find().toArray();
      const carIds = cars.map((car) => car._id);
      dealershipModel.cars = carIds;
  
      let numDeals = 3;
      const dealModels = [];
      for (let i = 0; i < numDeals; i++) {
        const dealModel = {
          car_id: carIds,
          deal_info: faker.lorem.sentences(),
        };
        dealModels.push(dealModel);
      }
  
      const dealResult = await dealCollection.insertMany(dealModels);
      console.log('Deal documents inserted successfully');
      const dealIds = dealResult.insertedIds;
      dealershipModel.deals.push(dealIds);
  
      let numSoldVehicles = 1;
      const soldVehiclesModels = [];
      for (let i = 0; i < numSoldVehicles; i++) {
        const soldVehiclesModel = {
          car_id: carIds,
          vehicle_info: {},
        };
        soldVehiclesModels.push(soldVehiclesModel);
      }
  
      const soldVehiclesResult = await soldVehiclesCollection.insertMany(soldVehiclesModels);
      console.log('Sold vehicle documents inserted successfully');
      const soldVehicleIds = soldVehiclesResult.insertedIds;
      dealershipModel.sold_vehicles = soldVehicleIds;
  
      await dealershipCollection.insertOne(dealershipModel);
      console.log('DealerShip document inserted successfully');
  
      let numUsers = 10;
      const userModels = [];
      for (let i = 0; i < numUsers; i++) {
        const userModel = {
          user_email: faker.internet.email(),
          user_location: faker.location.city(),
          user_info: faker.lorem.sentences(),
          password: faker.internet.password(),
          vehicle_info: soldVehicleIds,
        };
        if (userModel.password.toLowerCase().includes('password')) {
          throw new Error('Password is not allowed');
        }
        userModels.push(userModel);
      }
  
      await collection.insertMany(userModels);
      console.log('UserDocuments inserted successfully');
    } catch (error) {
      console.error('Error inserting fake data:', error);
      throw error;
    }
  }
  


  // Export the MongoClient
  export { MongoClient };
