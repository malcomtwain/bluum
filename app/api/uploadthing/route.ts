// Stub implementation for uploadthing route handler
import { NextResponse } from "next/server";
import { ourFileRouter } from "./core";

// Stub implementation of createNextRouteHandler
const createNextRouteHandler = ({ router }: { router: any }) => ({
  GET: async () => {
    return NextResponse.json({
      message: "Uploadthing configuration",
      router
    });
  },
  POST: async (req: Request) => {
    return NextResponse.json({
      message: "File upload stub",
      success: true,
      fileUrl: "https://example.com/uploaded-file.jpg"
    });
  }
});

// Export route handlers
export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter
}); 