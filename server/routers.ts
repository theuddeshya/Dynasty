import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { uploadFamilyFile, getFamilyFiles, getAllFamilyFiles, deleteFamilyFile } from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  files: router({
    uploadFile: protectedProcedure
      .input(z.object({
        familyMemberName: z.string(),
        fileName: z.string(),
        fileType: z.enum(["image", "document", "text"]),
        mimeType: z.string(),
        fileData: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Only admins can upload files");
        }

        try {
          const fileBuffer = Buffer.from(input.fileData, "base64");
          const fileKey = `family-files/${input.familyMemberName}/${Date.now()}-${input.fileName}`;
          
          const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

          await uploadFamilyFile({
            familyMemberName: input.familyMemberName,
            fileName: input.fileName,
            fileType: input.fileType,
            mimeType: input.mimeType,
            fileKey,
            fileUrl: url,
            fileSize: fileBuffer.length,
            description: input.description,
            uploadedBy: ctx.user.id,
          });

          return { success: true, url };
        } catch (error) {
          console.error("File upload error:", error);
          throw new Error("Failed to upload file");
        }
      }),

    getFilesForMember: publicProcedure
      .input(z.object({ familyMemberName: z.string() }))
      .query(async ({ input }) => {
        return await getFamilyFiles(input.familyMemberName);
      }),

    getAllFiles: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can view all files");
      }
      return await getAllFamilyFiles();
    }),

    deleteFile: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Only admins can delete files");
        }
        await deleteFamilyFile(input.fileId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
