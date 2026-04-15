import PlannedPayment from "../models/PlannedPayment.js";

export async function getPlannedPayments(req, res, next) {
  try {
    const plannedPayments = await PlannedPayment.find({
      user: req.user.userId,
    }).sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      plannedPayments,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPlannedPayment(req, res, next) {
  try {
    const { title, amount, dueDate, status, notes } = req.body;

    if (!title || amount === undefined || !dueDate) {
      return res.status(400).json({
        message: "Title, amount, and dueDate are required",
      });
    }

    const plannedPayment = await PlannedPayment.create({
      user: req.user.userId,
      title: title.trim(),
      amount,
      dueDate,
      status: status || "pending",
      notes: notes?.trim() || "",
    });

    res.status(201).json({
      message: "Planned payment created successfully",
      plannedPayment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePlannedPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { title, amount, dueDate, status, notes } = req.body;

    const plannedPayment = await PlannedPayment.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!plannedPayment) {
      return res.status(404).json({
        message: "Planned payment not found",
      });
    }

    if (title !== undefined) plannedPayment.title = title.trim();
    if (amount !== undefined) plannedPayment.amount = amount;
    if (dueDate !== undefined) plannedPayment.dueDate = dueDate;
    if (status !== undefined) plannedPayment.status = status;
    if (notes !== undefined) plannedPayment.notes = notes.trim();

    const updatedPlannedPayment = await plannedPayment.save();

    res.status(200).json({
      message: "Planned payment updated successfully",
      plannedPayment: updatedPlannedPayment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePlannedPayment(req, res, next) {
  try {
    const { id } = req.params;

    const plannedPayment = await PlannedPayment.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!plannedPayment) {
      return res.status(404).json({
        message: "Planned payment not found",
      });
    }

    await plannedPayment.deleteOne();

    res.status(200).json({
      message: "Planned payment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
