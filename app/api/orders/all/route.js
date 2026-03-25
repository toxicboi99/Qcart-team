import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/serializers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(orders.map(serializeOrder));
  } catch (error) {
    return errorResponse(error.message || "Failed to fetch orders", 400);
  }
}
