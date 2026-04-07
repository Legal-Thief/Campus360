import Auditorium from "../models/Auditorium.js";

// =======================
// CREATE AUDITORIUM
// =======================
export const createAuditorium = async (req, res) => {
  try {
    const {
      name,
      rows,
      seatsPerRow,
      blockedSeats,
    } = req.body;

    if (
      !name ||
      !rows ||
      rows.length === 0 ||
      !seatsPerRow
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are needed",
      });
    }

    const auditorium = await Auditorium.create({
      name,
      rows,
      seatsPerRow,
      blockedSeats: blockedSeats || [],
    });

    res.status(201).json({
      success: true,
      message: "Auditorium created successfully",
      auditorium,
    });
  } catch (error) {
    console.log("CREATE AUDITORIUM ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET ALL AUDITORIUMS
// =======================
export const getAllAuditoriums = async (
  req,
  res
) => {
  try {
    const auditoriums = await Auditorium.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      auditoriums,
    });
  } catch (error) {
    console.log("GET AUDITORIUMS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET ONE AUDITORIUM
// =======================
export const getAuditoriumById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const auditorium =
      await Auditorium.findById(id);

    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    res.status(200).json({
      success: true,
      auditorium,
    });
  } catch (error) {
    console.log("GET AUDITORIUM ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};