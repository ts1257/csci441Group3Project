import Category from "../models/Category.js";

export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ user: req.user.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, subcategories } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const normalizedSubcategories = Array.isArray(subcategories)
      ? subcategories.map((item) => String(item).trim()).filter(Boolean)
      : [];

    const category = await Category.create({
      user: req.user.userId,
      name: name.trim(),
      subcategories: normalizedSubcategories,
    });

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, subcategories } = req.body;

    const category = await Category.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (name !== undefined) category.name = name.trim();
    if (subcategories !== undefined) {
      category.subcategories = Array.isArray(subcategories)
        ? subcategories.map((item) => String(item).trim()).filter(Boolean)
        : [];
    }

    const updatedCategory = await category.save();

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await category.deleteOne();

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
