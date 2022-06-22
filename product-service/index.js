const express = require("express");
const amqplib = require("amqplib");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

let channel;

const connect = async () => {
  try {
    const conn = await amqplib.connect("amqp://localhost:5672");
    channel = await conn.createChannel();
    await channel.assertQueue("PRODUCT");
  } catch (error) {
    console.log("Error occured: ", error);
  }
};
connect();

app.post("/product/buy", async (req, res) => {
  let order;
  const { ids } = req.body; // list of product ids that user wants to buy
  await channel.sendToQueue(
    "ORDER",
    Buffer.from(
      JSON.stringify({
        ids,
        user: "test@gmail.com",
      })
    )
  );

  channel.consume("PRODUCT", (msg) => {
    order = JSON.parse(msg.content.toString());
    console.log("Received from Order service: ", order);
    channel.ack(msg);
    res.send(order);
  });
});

app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
});
