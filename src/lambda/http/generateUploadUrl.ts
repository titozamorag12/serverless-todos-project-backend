import "source-map-support/register";

import {
  todoExists,
  createImage,
  getUploadUrl,
} from "../../businessLogic/todos";

import * as uuid from "uuid";
import * as express from "express";
import * as awsServerlessExpress from "aws-serverless-express";

const app = express();

app.post("/todos/:todoId/attachment", async (_req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Rquested-With, Content-Type, Accept"
  );

  const todoId = _req.params.todoId;
  const validTodoId = await todoExists(todoId);

  if (!validTodoId) {
    res.json({
      body: JSON.stringify({
        error: "Todo does not exist",
      }),
    });
    res.status(404).send();
  }

  const imageId = uuid.v4();
  const newItem = await createImage(todoId, imageId);

  const url = getUploadUrl(imageId);

  res.json({
    newItem: newItem,
    uploadUrl: url,
  });
  res.status(201).send();
});

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
