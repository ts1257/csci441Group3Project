import Trip from "../models/Trip.js";

function normalizeChecklist(checklist) {
  if (!Array.isArray(checklist)) return [];

  return checklist
    .map((item) => {
      if (typeof item === "string") {
        return { text: item.trim(), completed: false };
      }

      return {
        text: item.text?.trim() || "",
        completed: Boolean(item.completed),
      };
    })
    .filter((item) => item.text);
}

export async function createTrip(req, res, next) {
  try {
    const {
      tripName,
      destination,
      startDate,
      endDate,
      travelType,
      notes,
      checklist,
    } = req.body;

    if (!tripName || !destination) {
      return res
        .status(400)
        .json({ message: "Trip name and destination are required" });
    }

    const trip = await Trip.create({
      user: req.user.userId,
      tripName: tripName.trim(),
      destination: destination.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      travelType: travelType || "other",
      notes: notes?.trim() || "",
      checklist: normalizeChecklist(checklist),
    });

    res.status(201).json({ message: "Trip created successfully", trip });
  } catch (error) {
    next(error);
  }
}

export async function getTrips(req, res, next) {
  try {
    const trips = await Trip.find({ user: req.user.userId }).sort({
      startDate: 1,
      createdAt: -1,
    });
    res.status(200).json({ trips });
  } catch (error) {
    next(error);
  }
}

export async function updateTrip(req, res, next) {
  try {
    const { id } = req.params;
    const {
      tripName,
      destination,
      startDate,
      endDate,
      travelType,
      notes,
      checklist,
    } = req.body;

    const trip = await Trip.findOne({ _id: id, user: req.user.userId });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (tripName !== undefined) trip.tripName = tripName.trim();
    if (destination !== undefined) trip.destination = destination.trim();
    if (startDate !== undefined) trip.startDate = startDate || null;
    if (endDate !== undefined) trip.endDate = endDate || null;
    if (travelType !== undefined) trip.travelType = travelType;
    if (notes !== undefined) trip.notes = notes.trim();
    if (checklist !== undefined) trip.checklist = normalizeChecklist(checklist);

    const updatedTrip = await trip.save();
    res
      .status(200)
      .json({ message: "Trip updated successfully", trip: updatedTrip });
  } catch (error) {
    next(error);
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const { id } = req.params;
    const trip = await Trip.findOne({ _id: id, user: req.user.userId });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await trip.deleteOne();
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    next(error);
  }
}
