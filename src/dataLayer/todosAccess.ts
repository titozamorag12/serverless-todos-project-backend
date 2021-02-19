import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";

import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";

import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createLogger } from "../utils/logger";

const XAWS = AWSXRay.captureAWS(AWS);
const logger = createLogger("todosAccess");
const s3 = new XAWS.S3({
  signatureVersion: "v4",
});

export class TodoItemAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoItemsTable = process.env.TODOS_TABLE,
    private readonly imagesTable = process.env.IMAGES_TABLE,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getAllTodoItems(): Promise<TodoItem[]> {
    logger.info("Getting all TodoItems");

    const result = await this.docClient
      .scan({
        TableName: this.todoItemsTable,
      })
      .promise();

    const items = result.Items;
    return items as TodoItem[];
  }

  async todoExists(todoId: String) {
    const result = await this.docClient
      .get({
        TableName: this.todoItemsTable,
        Key: {
          todoId: todoId,
        },
      })
      .promise();

    const exists = !!result.Item;
    logger.info("Check if todo exists", { result: exists });

    return exists;
  }

  async createImage(todoId: String, imageId: String) {
    const timestamp = new Date().toISOString();

    const newItem = {
      todoId,
      timestamp,
      imageId,
      imageUrl: `https://${this.bucketName}.s3.amazonaws.com/${imageId}`,
    };
    logger.info("Storing new item", { newItem: newItem });
    await this.docClient
      .put({
        TableName: this.imagesTable,
        Item: newItem,
      })
      .promise();

    await this.updateTodoItemAttachment(todoId, newItem.imageUrl);

    return newItem;
  }

  getUploadUrl(imageId: String) {
    const signedUrl = s3.getSignedUrl("putObject", {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: Number(this.urlExpiration),
    });

    logger.info("Getting upload (S3) URL", { signedUrl: signedUrl });

    return signedUrl;
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todoItemsTable,
        Item: todoItem,
      })
      .promise();

    logger.info("Creating todo item", { todoItem: todoItem });
    return todoItem;
  }

  async updateTodoItemAttachment(todoId: String, attachmentUrl: String) {
    logger.info("Update todo attachamentUrl", {
      todoId: todoId,
      attachment: attachmentUrl,
    });
    await this.docClient
      .update({
        TableName: this.todoItemsTable,
        Key: {
          todoId: todoId,
        },
        UpdateExpression: "set attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues: {
          ":attachmentUrl": attachmentUrl,
        },
      })
      .promise();
  }

  async updateTodoItem(todoId: string, todoUpdate: TodoUpdate) {
    logger.info("Updating todo item: ", { todoUpdate: todoUpdate });
    await this.docClient
      .update({
        TableName: this.todoItemsTable,
        Key: {
          todoId: todoId,
        },
        UpdateExpression:
          "set #name = :name, done = :done, dueDate = :dueDate, userId = :userId",
        ExpressionAttributeNames: {
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":name": todoUpdate.name,
          ":done": todoUpdate.done,
          ":dueDate": todoUpdate.dueDate,
          ":userId": todoUpdate.userId,
        },
      })
      .promise();
  }

  async deleteTodoItem(todoId: String) {
    logger.info("Deleting todo item", { todoId: todoId });
    await this.docClient
      .delete({
        TableName: this.todoItemsTable,
        Key: {
          todoId: todoId,
        },
      })
      .promise();
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info("Creating a local DynamoDB instance");
    return new XAWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000",
    });
  }

  return new XAWS.DynamoDB.DocumentClient();
}
