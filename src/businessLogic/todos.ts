import * as uuid from "uuid";

import { TodoItem } from "../models/TodoItem";
import { TodoItemAccess } from "../dataLayer/todosAccess";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { parseUserId } from "../auth/utils";

const todosAccess = new TodoItemAccess();

export async function getAllTodoItems(): Promise<TodoItem[]> {
  return todosAccess.getAllTodoItems();
}

export async function todoExists(todoId: String) {
  return todosAccess.todoExists(todoId);
}

export async function createImage(todoId: String, imageId: String) {
  return todosAccess.createImage(todoId, imageId);
}

export function getUploadUrl(todoId: String) {
  return todosAccess.getUploadUrl(todoId);
}

export async function deleteTodoItem(todoId: String) {
  return todosAccess.deleteTodoItem(todoId);
}

export async function createTodoItem(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {
  const itemId = uuid.v4();
  const userId = parseUserId(jwtToken);

  return await todosAccess.createTodoItem({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: "",
  });
}

export async function updateTodoItem(
  todoId: string,
  UpdateTodoRequest: UpdateTodoRequest,
  jwtToken: string
) {
  const userId = parseUserId(jwtToken);

  return await todosAccess.updateTodoItem(todoId, {
    userId: userId,
    name: UpdateTodoRequest.name,
    dueDate: UpdateTodoRequest.dueDate,
    done: UpdateTodoRequest.done,
  });
}
