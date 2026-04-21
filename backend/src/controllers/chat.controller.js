import { getDirections } from "../services/navigation.service.js";

export const chatController = (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "A valid message string is required",
      });
    }

    const result = getDirections(message.trim());

    return res.status(200).json({
      success: true,
      steps: result.steps,
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
