import { authService } from "../services/authService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.validatedData);
    res.status(201).json({ user });
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.validatedData);
    res.json(result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const { tokenId, token } = req.body;
    const result = await authService.refreshAccessToken({ tokenId, token });
    res.json(result);
  }),

  logout: asyncHandler(async (req, res) => {
    const { tokenId } = req.body;
    const result = await authService.logout({ tokenId });
    res.json(result);
  }),

  me: asyncHandler(async (req, res) => {
    // req.user is set by authenticate middleware
    const user = req.user.toPublic
      ? req.user.toPublic()
      : {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt,
        };
    res.json({ user });
  }),

  requestPasswordReset: asyncHandler(async (req, res) => {
    const result = await authService.requestPasswordReset(req.validatedData);
    res.json(result);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.validatedData);
    res.json(result);
  }),
};
