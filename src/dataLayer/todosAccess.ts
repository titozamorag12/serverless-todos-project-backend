import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const XAWS = AWSXRay.captureAWS(AWS);

import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";

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
    console.log("Getting all TodoItems");

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

    console.log("Get todo: ", result);
    return !!result.Item;
  }

  async createImage(todoId: String, imageId: String) {
    const timestamp = new Date().toISOString();

    const newItem = {
      todoId,
      timestamp,
      imageId,
      imageUrl: `https://${this.bucketName}.s3.amazonaws.com/${imageId}`,
    };
    console.log("Storing new item: ", newItem);

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
    return s3.getSignedUrl("putObject", {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: Number(this.urlExpiration),
    });
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todoItemsTable,
        Item: todoItem,
      })
      .promise();

    return todoItem;
  }

  async updateTodoItemAttachment(todoId: String, attachmentUrl: String) {
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
    console.log("Creating a local DynamoDB instance");
    return new XAWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000",
    });
  }

  return new XAWS.DynamoDB.DocumentClient();
}
