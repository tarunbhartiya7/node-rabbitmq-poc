const express = require("express");
const amqplib = require("amqplib");

const app = express();
const PORT = process.env.PORT || 8081;

let channel;

const createOrder = (ids, user) => {
  return {
    orderId: 1,
    ids,
    user,
    totalPrice: 1000,
  };
};

const connect = async () => {
  try {
    const conn = await amqplib.connect("amqp://localhost:5672");
    channel = await conn.createChannel();
    await channel.assertQueue("ORDER");

    channel.consume("ORDER", (msg) => {
      const { ids, user } = JSON.parse(msg.content.toString());
      channel.ack(msg);
      console.log("Received from Product service ", { ids, user });

      const newOrder = createOrder(ids, user);
      channel.sendToQueue("PRODUCT", Buffer.from(JSON.stringify({ newOrder })));
    });
  } catch (error) {
    console.log("Error occured: ", error);
  }
};
connect();

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});
