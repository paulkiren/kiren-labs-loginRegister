import { userService } from "../services/userService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const userController = {
  getUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.json({ user });
  }),

  getAllUsers: asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json({ users, count: users.length });
  }),

  updateUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Only allow users to update their own profile
    if (req.userId !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await userService.updateUser(id, req.body);
    res.json({ user });
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Only allow users to delete their own account
    if (req.userId !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await userService.deleteUser(id);
    res.json(result);
  }),
};
