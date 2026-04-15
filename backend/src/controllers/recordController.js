import Record from "../models/Record.js";

export async function getRecords(req, res, next) {
  try {
    const records = await Record.find({ user: req.user.userId }).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      records,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRecord(req, res, next) {
  try {
    const { title, type, amount, category, subcategory, date, notes } = req.body;

    if (!title || !type || amount === undefined || !category || !date) {
      return res.status(400).json({
        message: "Title, type, amount, category, and date are required",
      });
    }

    const record = await Record.create({
      user: req.user.userId,
      title: title.trim(),
      type,
      amount,
      category: category.trim(),
      subcategory: subcategory?.trim() || "",
      date,
      notes: notes?.trim() || "",
    });

    res.status(201).json({
      message: "Record created successfully",
      record,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRecord(req, res, next) {
  try {
    const { id } = req.params;
    const { title, type, amount, category, subcategory, date, notes } = req.body;

    const record = await Record.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    if (title !== undefined) record.title = title.trim();
    if (type !== undefined) record.type = type;
    if (amount !== undefined) record.amount = amount;
    if (category !== undefined) record.category = category.trim();
    if (subcategory !== undefined) record.subcategory = subcategory.trim();
    if (date !== undefined) record.date = date;
    if (notes !== undefined) record.notes = notes.trim();

    const updatedRecord = await record.save();

    res.status(200).json({
      message: "Record updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecord(req, res, next) {
  try {
    const { id } = req.params;

    const record = await Record.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!record) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    await record.deleteOne();

    res.status(200).json({
      message: "Record deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
