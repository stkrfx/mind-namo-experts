import { createUploadthing } from "uploadthing/next";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const f = createUploadthing();

export const ourFileRouter = {
  // SR-DEV: Updated to accept Image and PDF
  chatAttachment: f({ 
    audio: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 }
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
};