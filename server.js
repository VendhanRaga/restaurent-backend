const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const cors = require("cors");

require('dotenv').config()

const order = require('./models/ordermodel')

const env = require('dotenv').config({path: '../.env'});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const productRouter = require('./routes/productroute');
const app = express();
var corsOptions = {
    origin: "http://localhost:3000"
}
const calculateOrderAmount = (orderItems) => {
  const initialValue = 0;
  const itemsPrice = orderItems.reduce(
      (previousValue, currentValue) =>
      previousValue + currentValue.price * currentValue.amount, initialValue
  );
  return itemsPrice * 100;
}

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors(corsOptions));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.post('/webhook', async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
  } else if (eventType === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed.');
  }
  res.sendStatus(200);
});

app.use(
    express.json()
      // We need the raw body to verify webhook signatures.
      // Let's compute it only when hitting the Stripe webhook endpoint.
    //   verify: function (req, res, buf) {
    //     if (req.originalUrl.startsWith('/webhook')) {
    //       req.rawBody = buf.toString();
    //     }
    //   },
    
  );
app.use('/api/', productRouter);



app.post('/create-payment-intent', async(req, res) => {
  try {
      const { orderItems, shippingAddress, userId } = req.body;
      console.log(shippingAddress);

      const totalPrice = calculateOrderAmount(orderItems);

      const taxPrice = 0;
      const shippingPrice = 0;

      const order = new order({
          orderItems,
          shippingAddress,
          paymentMethod: 'stripe',
          totalPrice,
          taxPrice,
          shippingPrice,
          user: ''
      })

     
      const paymentIntent = await stripe.paymentIntents.create({
          amount: totalPrice,
          currency: 'INR'
      })

      res.send({
          clientSecret: paymentIntent.client_secret
      })
  } catch(e) {
      res.status(400).json({
          error: {
              message: e.message
          }
      })
  }
})

const PORT = process.env.port || 5500

app.get('/',(req, res) =>{
    res.send("server working good")
})
 
mongoose
.connect(process.env.MONGODB_URL)
.then(()=> console.log('Connected to Restaurent'))
.catch((err)=>console.log(err))






app.listen(PORT, ()=>console.log(`server listening on ${PORT}`))