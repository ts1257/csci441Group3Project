import Course from "../models/Course.js";

export async function getCourses(req, res, next) {
  try {
    const courses = await Course.find({ user: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      courses,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCourse(req, res, next) {
  try {
    const { name, notes } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Course name is required",
      });
    }

    const course = await Course.create({
      user: req.user.userId,
      name: name.trim(),
      notes: notes?.trim() || "",
    });

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { name, notes } = req.body;

    const course = await Course.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    if (name !== undefined) course.name = name.trim();
    if (notes !== undefined) course.notes = notes.trim();

    const updatedCourse = await course.save();

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;

    const course = await Course.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    await course.deleteOne();

    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
