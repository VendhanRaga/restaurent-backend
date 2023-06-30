const { faker } = require('@faker-js/faker');
const MongoClient = require("mongodb").MongoClient;
const _ = require("lodash");

async function main() {
    const uri = "mongodb+srv://Ragavendran:ragavendran123@cluster0.fpmjbax.mongodb.net/"

    
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const productsCollection = client.db("restaurent").collection("products");
        const categoriesCollection = client.db("restaurent").collection("catageries");

        let catageries = ['breakfast', 'lunch', 'dinner', 'drinks'].map((category) => { return { name: category } });
        await categoriesCollection.insertMany(catageries);

        let imageUrls = [
            'https://cdn.pixabay.com/photo/2017/06/16/11/38/breakfast-2408818_1280.jpg',
            'https://cdn.pixabay.com/photo/2016/10/25/13/42/indian-1768906_1280.jpg',
            'https://cdn.pixabay.com/photo/2017/09/09/12/09/india-2731817_1280.jpg',
        ]

        let products = [];
        for (let i = 0; i < 10; i+=1) {
            let newProduct = {
                name: faker.commerce.productName(),
                adjective: faker.commerce.productAdjective(),
                desciption: faker.commerce.productDescription(),
                price: faker.commerce.price(),
                category: _.sample(catageries),
                imageUrl: _.sample(imageUrls)
            };
            products.push(newProduct);
        }
        await productsCollection.insertMany(products);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();