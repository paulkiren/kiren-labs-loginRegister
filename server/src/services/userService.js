import { storage } from "./storage.js";
import { NotFoundError } from "../utils/errors.js";
import { User } from "../models/User.js";

export const userService = {
  async getUserById(id) {
    const user = await storage.getUserById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user.toPublic ? user.toPublic() : User.fromData(user).toPublic();
  },

  async getAllUsers() {
    const users = await storage.getAllUsers();
    return users.map((u) =>
      u.toPublic ? u.toPublic() : User.fromData(u).toPublic()
    );
  },

  async updateUser(id, updates) {
    const user = await storage.getUserById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const allowedUpdates = ["name"];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return user.toPublic ? user.toPublic() : User.fromData(user).toPublic();
    }

    filteredUpdates.updatedAt = new Date().toISOString();

    const updated = await storage.updateUser(id, filteredUpdates);
    return updated.toPublic
      ? updated.toPublic()
      : User.fromData(updated).toPublic();
  },

  async deleteUser(id) {
    const deleted = await storage.deleteUser(id);
    if (!deleted) {
      throw new NotFoundError("User not found");
    }
    return { message: "User deleted successfully" };
  },
};
