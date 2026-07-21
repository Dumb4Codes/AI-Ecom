import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  createProductSchema,
  getProductsForAdminSchema,
  updateProductSchema,
  productIdParamSchema,
} from "../validators/product.validator";
import {
  createProductService,
  getProductsForAdminService,
  updateProductService,
  deleteProductService,
  getProductByIdForAdminService,
} from "../services/product.service";
import {
  getAdminAnalyticsService,
  getAdminOrdersService,
  updateOrderStatusService,
} from "../services/admin.service";
import { uploadMultipleImagesToS3 } from "../utils/s3.util";
import { generateAIAdminSchema } from "../validators/ai.validator";
import { generateAIAdminService } from "../services/ai.service";
import {
  getAdminOrdersSchema,
  updateOrderStatusBodySchema,
  updateOrderStatusParamsSchema,
} from "../validators/admin.validator";

export const createProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const data = createProductSchema.parse(req.body);
    const product = await createProductService(userId, data);

    res.status(HTTPSTATUS.CREATED).json({
      message: "Product created successfully",
      product,
    });
  }
);

export const getProductsForAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = getProductsForAdminSchema.parse(req.query);
    const result = await getProductsForAdminService(query);

    res.status(HTTPSTATUS.OK).json({
      message: "Products retrieved successfully",
      ...result,
    });
  }
);

export const getProductByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = productIdParamSchema.parse(req.params);
    const product = await getProductByIdForAdminService(id);

    res.status(HTTPSTATUS.OK).json({
      message: "Product retrieved successfully",
      product,
    });
  }
);

export const updateProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = productIdParamSchema.parse(req.params);
    const data = updateProductSchema.parse(req.body);
    const product = await updateProductService(id, data);

    res.status(HTTPSTATUS.OK).json({
      message: "Product updated successfully",
      product,
    });
  }
);

export const deleteProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = productIdParamSchema.parse(req.params);
    await deleteProductService(id);

    res.status(HTTPSTATUS.OK).json({
      message: "Product deleted successfully",
    });
  }
);

export const getAdminAnalyticsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await getAdminAnalyticsService();

    res.status(HTTPSTATUS.OK).json({
      message: "Analytics retrieved successfully",
      ...result,
    });
  }
);

export const getAdminOrdersController = asyncHandler(
  async (req: Request, res: Response) => {
    const query = getAdminOrdersSchema.parse(req.query);
    const result = await getAdminOrdersService(query);

    res.status(HTTPSTATUS.OK).json({
      message: "Orders retrieved successfully",
      ...result,
    });
  }
);

export const updateOrderStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const params = updateOrderStatusParamsSchema.parse(req.params);
    const body = updateOrderStatusBodySchema.parse(req.body);
    const result = await updateOrderStatusService(params, body);

    res.status(HTTPSTATUS.OK).json({
      message: "Order status updated successfully",
      ...result,
    });
  }
);

export const uploadProductImagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    try {
      const uploaded = await uploadMultipleImagesToS3(files);
      res.status(HTTPSTATUS.OK).json({
        message: "Images uploaded successfully",
        images: uploaded.map((image) => image.url),
      });
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw error;
    }
  }
);

export const generateAIAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = generateAIAdminSchema.parse(req.body);
    const result = await generateAIAdminService(data);

    res.status(HTTPSTATUS.OK).json({
      message: "AI content generated successfully",
      ...result,
    });
  }
);
